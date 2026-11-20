"use server";

import { redirect } from "next/navigation";
import { canApprovePayment, requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { flashRedirect } from "@/lib/flash";
import { loadSettings } from "@/lib/settings";

export async function approvePaymentAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("payment_id"));
  const sql = getDb();
  const settings = await loadSettings();
  const rows = await sql`
    SELECT id, amount, status, requires_senior_approval
    FROM payment_requests WHERE id = ${id}
  `;
  if (!rows.length) redirect("/payments");
  const pr = rows[0];
  if (pr.status !== "Pending") {
    redirect(flashRedirect(`/payments/${id}`, "This payment request is not pending."));
  }
  const amount = Number(pr.amount);
  const ok = canApprovePayment(
    session.role,
    amount,
    settings.senior_approval_threshold,
    Boolean(pr.requires_senior_approval)
  );
  if (!ok) {
    redirect(flashRedirect(`/payments/${id}`, "You are not allowed to approve this payment request."));
  }
  await sql`UPDATE payment_requests SET status = 'Approved' WHERE id = ${id}`;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "approve",
    entity: "payment_request",
    entityId: String(id),
  });
  redirect(flashRedirect(`/payments/${id}`, `Payment request ${id} approved.`));
}

export async function rejectPaymentAction(formData: FormData) {
  const session = await requireSession();
  const id = Number(formData.get("payment_id"));
  const sql = getDb();
  const settings = await loadSettings();
  const rows = await sql`
    SELECT id, amount, status, requires_senior_approval
    FROM payment_requests WHERE id = ${id}
  `;
  if (!rows.length) redirect("/payments");
  const pr = rows[0];
  if (pr.status !== "Pending") {
    redirect(flashRedirect(`/payments/${id}`, "This payment request is not pending."));
  }
  const amount = Number(pr.amount);
  const ok = canApprovePayment(
    session.role,
    amount,
    settings.senior_approval_threshold,
    Boolean(pr.requires_senior_approval)
  );
  if (!ok) {
    redirect(flashRedirect(`/payments/${id}`, "You are not allowed to reject this payment request."));
  }
  await sql`UPDATE payment_requests SET status = 'Rejected' WHERE id = ${id}`;
  await writeAudit({
    actor: session.username,
    role: session.role,
    action: "reject",
    entity: "payment_request",
    entityId: String(id),
  });
  redirect(flashRedirect(`/payments/${id}`, `Payment request ${id} rejected.`));
}