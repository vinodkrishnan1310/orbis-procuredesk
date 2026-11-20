import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { Flash } from "@/components/Flash";
import { getInvoiceMatchContext } from "@/lib/invoices-db";
import { matchChecksPassForMarkMatched } from "@/lib/match-check";
import {
  createPaymentRequestAction,
  flagExceptionAction,
  markMatchedAction,
} from "@/app/actions/invoices";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flash?: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const sp = await searchParams;
  const sql = getDb();
  const rows = await sql`
    SELECT i.*, v.name AS vendor_name,
      COALESCE(po.po_number, i.po_ref_text) AS po_display
    FROM invoices i
    JOIN vendors v ON v.id = i.vendor_id
    LEFT JOIN purchase_orders po ON po.id = i.po_id
    WHERE i.id = ${id}
  `;
  if (!rows.length) notFound();
  const inv = rows[0];
  const ctx = await getInvoiceMatchContext(id);
  if (!ctx) notFound();
  const canMark = matchChecksPassForMarkMatched(ctx.checks);
  const isMatched = inv.status === "Matched";
  const hasPayment = await sql`
    SELECT id FROM payment_requests WHERE invoice_id = ${id}
  `;

  return (
    <>
      <h1>Invoice {inv.invoice_number as string}</h1>
      <Flash message={sp.flash} />
      <p>
        <Link href="/invoices">Back to invoices</Link>
      </p>
      <dl className="my-4 space-y-1">
        <div>
          <dt className="inline font-semibold">Vendor: </dt>
          <dd className="inline">{inv.vendor_name as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">PO: </dt>
          <dd className="inline">{(inv.po_display as string) || "—"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Quantity: </dt>
          <dd className="inline">{String(inv.quantity)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Unit price: </dt>
          <dd className="inline">${formatUsd(Number(inv.unit_price))}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Total: </dt>
          <dd className="inline">${formatUsd(Number(inv.total))}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Status: </dt>
          <dd className="inline">{inv.status as string}</dd>
        </div>
        {inv.exception_reason ? (
          <div>
            <dt className="inline font-semibold">Exception reason: </dt>
            <dd className="inline">{inv.exception_reason as string}</dd>
          </div>
        ) : null}
      </dl>

      <section className="my-6 border border-gray-600 p-3" data-testid="match-check-panel">
        <h2 className="font-semibold text-base mb-2">Match check</h2>
        <ul className="space-y-1">
          {ctx.checks.map((c) => (
            <li key={c.key} data-testid={`match-${c.key}`}>
              {c.outcome}: {c.label} — {c.detail}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <form action={markMatchedAction} method="post" data-testid="mark-matched-form">
          <input type="hidden" name="invoice_id" value={id} />
          <button type="submit" disabled={!canMark || isMatched} data-testid="mark-matched">
            Mark as matched
          </button>
          {!canMark ? (
            <span className="ml-2 text-sm">Requires passing checks 1–5.</span>
          ) : null}
        </form>

        <form action={flagExceptionAction} method="post" data-testid="flag-exception-form">
          <input type="hidden" name="invoice_id" value={id} />
          <label htmlFor="reason">Flag as exception — reason</label>
          <input id="reason" name="reason" required />
          <button type="submit" data-testid="flag-exception">
            Flag as exception
          </button>
        </form>

        <form
          action={createPaymentRequestAction}
          method="post"
          data-testid="create-payment-form"
        >
          <input type="hidden" name="invoice_id" value={id} />
          <button
            type="submit"
            disabled={!isMatched || hasPayment.length > 0}
            data-testid="create-payment-request"
          >
            Create payment request
          </button>
          {!isMatched ? (
            <span className="ml-2 text-sm">Requires status Matched.</span>
          ) : null}
        </form>
      </section>
    </>
  );
}