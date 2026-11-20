import Link from "next/link";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";
import { Flash } from "@/components/Flash";

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; flash?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sql = getDb();

  const rows = q
    ? await sql`
        SELECT po.po_number, v.name AS vendor, po.description,
          po.quantity, po.unit_price, po.total, po.status
        FROM purchase_orders po
        JOIN vendors v ON v.id = po.vendor_id
        WHERE po.po_number ILIKE ${"%" + q + "%"}
          OR v.name ILIKE ${"%" + q + "%"}
        ORDER BY po.po_number
      `
    : await sql`
        SELECT po.po_number, v.name AS vendor, po.description,
          po.quantity, po.unit_price, po.total, po.status
        FROM purchase_orders po
        JOIN vendors v ON v.id = po.vendor_id
        ORDER BY po.po_number
      `;

  return (
    <>
      <h1>Purchase orders</h1>
      <Flash message={params.flash} />
      <form method="get" className="my-4" data-testid="po-search-form">
        <label htmlFor="q">Search PO number or vendor</label>
        <input id="q" name="q" type="search" defaultValue={q} />
        <button type="submit">Search</button>
      </form>
      <table data-testid="po-table">
        <thead>
          <tr>
            <th>PO number</th>
            <th>Vendor</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit price (USD)</th>
            <th>Total (USD)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.po_number as string}>
              <td>
                <Link href={`/purchase-orders/${encodeURIComponent(r.po_number as string)}`}>
                  {r.po_number as string}
                </Link>
              </td>
              <td>{r.vendor as string}</td>
              <td>{r.description as string}</td>
              <td>{String(r.quantity)}</td>
              <td>{formatUsd(Number(r.unit_price))}</td>
              <td>{formatUsd(Number(r.total))}</td>
              <td>{r.status as string}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}