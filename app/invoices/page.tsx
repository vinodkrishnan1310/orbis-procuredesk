import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { Flash } from "@/components/Flash";

const STATUSES = ["", "Received", "Matched", "Exception", "Paid"];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; flash?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? "").trim();
  const sql = getDb();

  const rows = status
    ? await sql`
        SELECT i.id, i.invoice_number, v.name AS vendor,
          COALESCE(po.po_number, i.po_ref_text) AS po_ref,
          i.total, i.status, i.received_at
        FROM invoices i
        JOIN vendors v ON v.id = i.vendor_id
        LEFT JOIN purchase_orders po ON po.id = i.po_id
        WHERE i.status = ${status}
        ORDER BY i.received_at DESC
      `
    : await sql`
        SELECT i.id, i.invoice_number, v.name AS vendor,
          COALESCE(po.po_number, i.po_ref_text) AS po_ref,
          i.total, i.status, i.received_at
        FROM invoices i
        JOIN vendors v ON v.id = i.vendor_id
        LEFT JOIN purchase_orders po ON po.id = i.po_id
        ORDER BY i.received_at DESC
      `;

  return (
    <>
      <h1>Invoices</h1>
      <Flash message={params.flash} />
      <p>
        <Link href="/invoices/new" data-testid="new-invoice-link">
          Enter new invoice
        </Link>
      </p>
      <form method="get" className="my-4" data-testid="invoice-filter-form">
        <label htmlFor="status">Filter by status</label>
        <select id="status" name="status" defaultValue={status}>
          <option value="">All</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button type="submit">Apply filter</button>
      </form>
      <table data-testid="invoices-table">
        <thead>
          <tr>
            <th>Invoice number</th>
            <th>Vendor</th>
            <th>PO</th>
            <th>Amount (USD)</th>
            <th>Status</th>
            <th>Received date (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as number}>
              <td>
                <Link href={`/invoices/${r.id}`}>{r.invoice_number as string}</Link>
              </td>
              <td>{r.vendor as string}</td>
              <td>{(r.po_ref as string) || "—"}</td>
              <td>{formatUsd(Number(r.total))}</td>
              <td>{r.status as string}</td>
              <td>{new Date(r.received_at as string).toISOString().slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}