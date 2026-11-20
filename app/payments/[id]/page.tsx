import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { Flash } from "@/components/Flash";
import { getSession } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { canApprovePayment } from "@/lib/auth";
import {
  approvePaymentAction,
  rejectPaymentAction,
} from "@/app/actions/payments";

export default async function PaymentDetailPage({
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
  const sql = getDb();
  const settings = await loadSettings();
  const rows = await sql`
    SELECT pr.*, i.invoice_number, v.name AS vendor
    FROM payment_requests pr
    JOIN invoices i ON i.id = pr.invoice_id
    JOIN vendors v ON v.id = i.vendor_id
    WHERE pr.id = ${id}
  `;
  if (!rows.length) notFound();
  const pr = rows[0];
  const amount = Number(pr.amount);
  const allow =
    session &&
    canApprovePayment(
      session.role,
      amount,
      settings.senior_approval_threshold,
      Boolean(pr.requires_senior_approval)
    );
  const pending = pr.status === "Pending";

  return (
    <>
      <h1>Payment request {id}</h1>
      <Flash message={sp.flash} />
      <p>
        <Link href="/payments">Back to payment requests</Link>
      </p>
      <dl className="my-4 space-y-1">
        <div>
          <dt className="inline font-semibold">Invoice: </dt>
          <dd className="inline">{pr.invoice_number as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Vendor: </dt>
          <dd className="inline">{pr.vendor as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Amount: </dt>
          <dd className="inline">${formatUsd(amount)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Status: </dt>
          <dd className="inline">{pr.status as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Senior approval required: </dt>
          <dd className="inline">{pr.requires_senior_approval ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <div className="flex gap-4 mt-4">
        <form action={approvePaymentAction} method="post" data-testid="approve-payment-form">
          <input type="hidden" name="payment_id" value={id} />
          <button type="submit" disabled={!allow || !pending} data-testid="approve-payment">
            Approve
          </button>
        </form>
        <form action={rejectPaymentAction} method="post" data-testid="reject-payment-form">
          <input type="hidden" name="payment_id" value={id} />
          <button type="submit" disabled={!allow || !pending} data-testid="reject-payment">
            Reject
          </button>
        </form>
      </div>
      {!allow ? (
        <p className="mt-2 text-sm" data-testid="approver-hint">
          Requires approver role.
        </p>
      ) : null}
    </>
  );
}