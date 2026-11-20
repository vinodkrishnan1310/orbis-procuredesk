import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { Flash } from "@/components/Flash";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ flash?: string }>;
}) {
  const params = await searchParams;
  const sql = getDb();
  const rows = await sql`
    SELECT pr.id, pr.amount, pr.status, pr.requires_senior_approval,
      i.invoice_number, v.name AS vendor
    FROM payment_requests pr
    JOIN invoices i ON i.id = pr.invoice_id
    JOIN vendors v ON v.id = i.vendor_id
    ORDER BY pr.created_at DESC
  `;

  return (
    <>
      <h1>Payment requests</h1>
      <Flash message={params.flash} />
      <table data-testid="payments-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Invoice</th>
            <th>Vendor</th>
            <th>Amount (USD)</th>
            <th>Status</th>
            <th>Senior approval</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id as number}>
              <td>
                <Link href={`/payments/${r.id}`}>{r.id as number}</Link>
              </td>
              <td>{r.invoice_number as string}</td>
              <td>{r.vendor as string}</td>
              <td>{formatUsd(Number(r.amount))}</td>
              <td>{r.status as string}</td>
              <td>{r.requires_senior_approval ? "Yes" : "No"}</td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={6}>No payment requests.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}