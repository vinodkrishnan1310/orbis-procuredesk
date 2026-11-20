import Link from "next/link";
import { getDb } from "@/lib/db";
import { createInvoiceAction } from "@/app/actions/invoices";

export default async function NewInvoicePage() {
  const sql = getDb();
  const vendors = await sql`SELECT id, name FROM vendors ORDER BY name`;

  return (
    <>
      <h1>Enter invoice</h1>
      <p>
        <Link href="/invoices">Back to invoices</Link>
      </p>
      <form
        action={createInvoiceAction}
        method="post"
        className="space-y-3 max-w-lg"
        data-testid="new-invoice-form"
      >
        <p>
          <label htmlFor="vendor_id">Vendor</label>
          <select id="vendor_id" name="vendor_id" required>
            <option value="">Select vendor</option>
            {vendors.map((v) => (
              <option key={v.id as number} value={v.id as number}>
                {v.name as string}
              </option>
            ))}
          </select>
        </p>
        <p>
          <label htmlFor="invoice_number">Invoice number</label>
          <input id="invoice_number" name="invoice_number" required />
        </p>
        <p>
          <label htmlFor="po_number">PO number (optional)</label>
          <input id="po_number" name="po_number" placeholder="PO-4001" />
        </p>
        <p>
          <label htmlFor="quantity">Quantity</label>
          <input id="quantity" name="quantity" type="number" step="any" required />
        </p>
        <p>
          <label htmlFor="unit_price">Unit price (USD)</label>
          <input id="unit_price" name="unit_price" type="number" step="0.01" required />
        </p>
        <p>
          <label htmlFor="invoice_date">Invoice date</label>
          <input id="invoice_date" name="invoice_date" type="date" required />
        </p>
        <p>
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} />
        </p>
        <button type="submit" data-testid="save-invoice">
          Save invoice
        </button>
      </form>
    </>
  );
}