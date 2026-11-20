"use server";

import { redirect } from "next/navigation";
import { requireSession, type UserRole } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { flashRedirect } from "@/lib/flash";

function isApprover(role: UserRole) {
  return role === "finance.approver" || role === "senior.approver";
}

export async function requestBankChangeAction(formData: FormData) {
  const session = await requireSession();
  const vendorId = Number(formData.get("vendor_id"));
  const account = String(formData.get("requested_account") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!account || !reason) {
    redirect(
      flashRedirect(`/vendors/${vendorId}`, "Account and reason are required.")
    );
  }
  const sql = getDb();
  const inserted = await sql`
    INSERT INTO vendor_change_requests (vendor_id, requested_account_masked, reason)
    VALUES (${vendorId}, ${account}, ${reason})
    RETURNING id
  `;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "create",
    entity: "vendor_change_request",
    entityId: String(inserted[0].id),
    details: account,
  });
  redirect(
    flashRedirect(`/vendors/${vendorId}`, "Vendor bank detail change request submitted.")
  );
}

export async function approveVendorChangeAction(formData: FormData) {
  const session = await requireSession();
  if (!isApprover(session.role)) {
    redirect(flashRedirect("/", "Requires approver role."));
  }
  const requestId = Number(formData.get("request_id"));
  const vendorId = Number(formData.get("vendor_id"));
  const sql = getDb();
  const rows = await sql`
    SELECT id, vendor_id, requested_account_masked, status
    FROM vendor_change_requests WHERE id = ${requestId}
  `;
  if (!rows.length || rows[0].status !== "Pending") {
    redirect(flashRedirect(`/vendors/${vendorId}`, "Request not found or not pending."));
  }
  const account = rows[0].requested_account_masked as string;
  await sql`
    UPDATE vendors SET bank_account_masked = ${account},
      bank_last_changed = (NOW() AT TIME ZONE 'UTC')::date
    WHERE id = ${rows[0].vendor_id}
  `;
  await sql`
    UPDATE vendor_change_requests SET status = 'Approved' WHERE id = ${requestId}
  `;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "approve",
    entity: "vendor_change_request",
    entityId: String(requestId),
  });
  redirect(flashRedirect(`/vendors/${vendorId}`, `Vendor change request ${requestId} approved.`));
}

export async function rejectVendorChangeAction(formData: FormData) {
  const session = await requireSession();
  if (!isApprover(session.role)) {
    redirect(flashRedirect("/", "Requires approver role."));
  }
  const requestId = Number(formData.get("request_id"));
  const vendorId = Number(formData.get("vendor_id"));
  const sql = getDb();
  await sql`
    UPDATE vendor_change_requests SET status = 'Rejected'
    WHERE id = ${requestId} AND status = 'Pending'
  `;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "reject",
    entity: "vendor_change_request",
    entityId: String(requestId),
  });
  redirect(flashRedirect(`/vendors/${vendorId}`, `Vendor change request ${requestId} rejected.`));
}