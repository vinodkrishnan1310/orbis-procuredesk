import { getDb } from "./db";
import { loadSettings } from "./settings";
import { runMatchChecks } from "./match-check";

export async function getInvoiceMatchContext(invoiceId: number) {
  const sql = getDb();
  const settings = await loadSettings();
  const rows = await sql`
    SELECT
      i.id,
      i.invoice_number,
      i.vendor_id,
      i.po_id,
      i.quantity,
      i.unit_price,
      i.total,
      i.status,
      i.po_ref_text,
      po.po_number,
      po.vendor_id AS po_vendor_id,
      po.unit_price AS po_unit_price,
      po.quantity AS po_quantity
    FROM invoices i
    LEFT JOIN purchase_orders po ON po.id = i.po_id
    WHERE i.id = ${invoiceId}
  `;
  if (!rows.length) return null;
  const inv = rows[0];

  const poRefText = (inv.po_ref_text as string | null)?.trim() || null;
  const poNumber: string | null =
    poRefText || (inv.po_number as string | null) || null;

  const dupRows = await sql`
    SELECT COUNT(*)::int AS c FROM invoices
    WHERE vendor_id = ${inv.vendor_id}
      AND invoice_number = ${inv.invoice_number}
      AND id <> ${invoiceId}
  `;
  const duplicateExists = (dupRows[0]?.c as number) > 0;

  const poExists = Boolean(inv.po_id);
  const checks = runMatchChecks({
    poNumber,
    poExists,
    invoiceVendorId: inv.vendor_id as number,
    poVendorId: inv.po_vendor_id as number | null,
    invoiceUnitPrice: Number(inv.unit_price),
    poUnitPrice: inv.po_unit_price != null ? Number(inv.po_unit_price) : null,
    invoiceQuantity: Number(inv.quantity),
    poQuantity: inv.po_quantity != null ? Number(inv.po_quantity) : null,
    invoiceNumber: inv.invoice_number as string,
    vendorId: inv.vendor_id as number,
    duplicateExists,
    totalAmount: Number(inv.total),
    priceTolerancePct: settings.price_tolerance_pct,
    seniorApprovalThreshold: settings.senior_approval_threshold,
  });

  return { invoice: inv, checks, settings };
}