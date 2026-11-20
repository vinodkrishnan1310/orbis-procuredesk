"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { flashRedirect } from "@/lib/flash";
import { parseDecimal } from "@/lib/format";
import { getInvoiceMatchContext } from "@/lib/invoices-db";
import { matchChecksPassForMarkMatched } from "@/lib/match-check";
import { loadSettings } from "@/lib/settings";

export async function createInvoiceAction(formData: FormData) {
  const session = await requireSession();
  const sql = getDb();
  const vendorId = Number(formData.get("vendor_id"));
  const invoiceNumber = String(formData.get("invoice_number") ?? "").trim();
  const poNumberRaw = String(formData.get("po_number") ?? "").trim();
  const quantity = parseDecimal(String(formData.get("quantity")));
  const unitPrice = parseDecimal(String(formData.get("unit_price")));
  const invoiceDate = String(formData.get("invoice_date") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  let poId: number | null = null;
  if (poNumberRaw) {
    const poRows = await sql`
      SELECT id FROM purchase_orders WHERE po_number = ${poNumberRaw}
    `;
    if (poRows.length) poId = poRows[0].id as number;
  }

  const total = Math.round(quantity * unitPrice * 100) / 100;

  const inserted = await sql`
    INSERT INTO invoices (
      invoice_number, vendor_id, po_id, po_ref_text, quantity, unit_price, total,
      status, invoice_date, notes
    ) VALUES (
      ${invoiceNumber}, ${vendorId}, ${poId}, ${poNumberRaw || null},
      ${quantity}, ${unitPrice}, ${total},
      'Received', ${invoiceDate}, ${notes}
    )
    RETURNING id
  `;
  const id = inserted[0].id as number;

  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "create",
    entity: "invoice",
    entityId: String(id),
    details: `Invoice ${invoiceNumber} created`,
  });

  redirect(flashRedirect(`/invoices/${id}`, `Invoice ${invoiceNumber} saved.`));
}

export async function markMatchedAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("invoice_id"));
  const ctx = await getInvoiceMatchContext(id);
  if (!ctx) redirect("/invoices");
  if (!matchChecksPassForMarkMatched(ctx.checks)) {
    redirect(
      flashRedirect(
        `/invoices/${id}`,
        `Invoice ${ctx.invoice.invoice_number} cannot be marked matched — match check failed.`
      )
    );
  }
  const sql = getDb();
  await sql`UPDATE invoices SET status = 'Matched' WHERE id = ${id}`;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "update",
    entity: "invoice",
    entityId: String(id),
    details: "Marked as matched",
  });
  redirect(
    flashRedirect(
      `/invoices/${id}`,
      `Invoice ${ctx.invoice.invoice_number} marked as matched.`
    )
  );
}

export async function flagExceptionAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("invoice_id"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    redirect(flashRedirect(`/invoices/${id}`, "Exception reason is required."));
  }
  const sql = getDb();
  const rows = await sql`SELECT invoice_number FROM invoices WHERE id = ${id}`;
  if (!rows.length) redirect("/invoices");
  const invoiceNumber = rows[0].invoice_number as string;
  await sql`
    UPDATE invoices SET status = 'Exception', exception_reason = ${reason}
    WHERE id = ${id}
  `;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "update",
    entity: "invoice",
    entityId: String(id),
    details: `Flagged exception: ${reason}`,
  });
  redirect(
    flashRedirect(
      `/invoices/${id}`,
      `Invoice ${invoiceNumber} flagged as exception.`
    )
  );
}

export async function createPaymentRequestAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("invoice_id"));
  const sql = getDb();
  const rows = await sql`
    SELECT invoice_number, status, total FROM invoices WHERE id = ${id}
  `;
  if (!rows.length) redirect("/invoices");
  const inv = rows[0];
  if (inv.status !== "Matched") {
    redirect(
      flashRedirect(
        `/invoices/${id}`,
        "Payment requests require invoice status Matched."
      )
    );
  }
  const existing = await sql`
    SELECT id FROM payment_requests WHERE invoice_id = ${id}
  `;
  if (existing.length) {
    redirect(
      flashRedirect(`/invoices/${id}`, "A payment request already exists for this invoice.")
    );
  }
  const settings = await loadSettings();
  const amount = Number(inv.total);
  const requiresSenior = amount > settings.senior_approval_threshold;
  const pr = await sql`
    INSERT INTO payment_requests (invoice_id, amount, requires_senior_approval)
    VALUES (${id}, ${amount}, ${requiresSenior})
    RETURNING id
  `;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "create",
    entity: "payment_request",
    entityId: String(pr[0].id),
    details: `Payment request for invoice ${inv.invoice_number}`,
  });
  redirect(
    flashRedirect(
      `/invoices/${id}`,
      `Payment request created for invoice ${inv.invoice_number}.`
    )
  );
}