import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { formatUsd } from "@/lib/format";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ po: string }>;
}) {
  const { po } = await params;
  const sql = getDb();
  const poRows = await sql`
    SELECT po.id, po.po_number, po.description, po.quantity, po.unit_price,
      po.total, po.status, v.name AS vendor
    FROM purchase_orders po
    JOIN vendors v ON v.id = po.vendor_id
    WHERE po.po_number = ${decodeURIComponent(po)}
  `;
  if (!poRows.length) notFound();
  const row = poRows[0];
  const invoices = await sql`
    SELECT i.id, i.invoice_number, i.total, i.status, i.received_at
    FROM invoices i
    WHERE i.po_id = ${row.id}
    ORDER BY i.received_at DESC
  `;

  return (
    <>
      <h1>Purchase order {row.po_number as string}</h1>
      <p>
        <Link href="/purchase-orders">Back to purchase orders</Link>
      </p>
      <dl className="my-4 space-y-1">
        <div>
          <dt className="inline font-semibold">Vendor: </dt>
          <dd className="inline">{row.vendor as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Description: </dt>
          <dd className="inline">{row.description as string}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Quantity: </dt>
          <dd className="inline">{String(row.quantity)}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Unit price: </dt>
          <dd className="inline">${formatUsd(Number(row.unit_price))}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Total: </dt>
          <dd className="inline">${formatUsd(Number(row.total))}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Status: </dt>
          <dd className="inline">{row.status as string}</dd>
        </div>
      </dl>
      <h2 className="font-semibold mt-6">Linked invoices</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Received (UTC)</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr key={i.id as number}>
              <td>
                <Link href={`/invoices/${i.id}`}>{i.invoice_number as string}</Link>
              </td>
              <td>${formatUsd(Number(i.total))}</td>
              <td>{i.status as string}</td>
              <td>{new Date(i.received_at as string).toISOString().replace("T", " ").slice(0, 19)}</td>
            </tr>
          ))}
          {!invoices.length ? (
            <tr>
              <td colSpan={4}>No invoices linked.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  );
}