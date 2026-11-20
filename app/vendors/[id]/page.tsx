import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { Flash } from "@/components/Flash";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import {
  approveVendorChangeAction,
  rejectVendorChangeAction,
  requestBankChangeAction,
} from "@/app/actions/vendors";

export default async function VendorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const sp = await searchParams;
  const session = await getSession();
  if (session) {
    await writeAudit({
      actor: session.username,
      role: session.role,
      action: "viewed_vendor_bank_details",
      entity: "vendor",
      entityId: String(id),
    });
  }

  const sql = getDb();
  const rows = await sql`
    SELECT id, name, bank_account_masked, bank_last_changed FROM vendors WHERE id = ${id}
  `;
  if (!rows.length) notFound();
  const vendor = rows[0];
  const requests = await sql`
    SELECT id, requested_account_masked, reason, status, created_at
    FROM vendor_change_requests
    WHERE vendor_id = ${id}
    ORDER BY created_at DESC
  `;
  const isApprover =
    session?.role === "finance.approver" || session?.role === "senior.approver";

  return (
    <>
      <h1>{vendor.name as string}</h1>
      <Flash message={sp.flash} />
      <p>
        <Link href="/vendors">Back to vendors</Link>
      </p>
      <dl className="my-4 space-y-1" data-testid="vendor-bank-details">
        <div>
          <dt className="inline font-semibold">Bank account (masked): </dt>
          <dd className="inline">{vendor.bank_account_masked as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Last changed: </dt>
          <dd className="inline">{String(vendor.bank_last_changed)}</dd>
        </div>
      </dl>

      <section className="my-6">
        <h2 className="font-semibold">Request bank detail change</h2>
        <form
          action={requestBankChangeAction}
          method="post"
          data-testid="vendor-change-form"
        >
          <input type="hidden" name="vendor_id" value={id} />
          <p>
            <label htmlFor="requested_account">New masked account</label>
            <input id="requested_account" name="requested_account" placeholder="****9937" />
          </p>
          <p>
            <label htmlFor="vcr_reason">Reason</label>
            <input id="vcr_reason" name="reason" required />
          </p>
          <button type="submit">Submit change request</button>
        </form>
      </section>

      <section>
        <h2 className="font-semibold">Open change requests</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Requested account</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id as number}>
                <td>{r.id as number}</td>
                <td>{r.requested_account_masked as string}</td>
                <td>{r.reason as string}</td>
                <td>{r.status as string}</td>
                <td>
                  {r.status === "Pending" ? (
                    <div className="flex gap-2">
                      <form action={approveVendorChangeAction} method="post">
                        <input type="hidden" name="request_id" value={r.id as number} />
                        <input type="hidden" name="vendor_id" value={id} />
                        <button type="submit" disabled={!isApprover}>
                          Approve
                        </button>
                      </form>
                      <form action={rejectVendorChangeAction} method="post">
                        <input type="hidden" name="request_id" value={r.id as number} />
                        <input type="hidden" name="vendor_id" value={id} />
                        <button type="submit" disabled={!isApprover}>
                          Reject
                        </button>
                      </form>
                      {!isApprover ? (
                        <span className="text-sm">Requires approver role.</span>
                      ) : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {!requests.length ? (
              <tr>
                <td colSpan={5}>No change requests.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}