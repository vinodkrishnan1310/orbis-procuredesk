import { getDb } from "./db";

export type PortalSettings = {
  price_tolerance_pct: number;
  senior_approval_threshold: number;
};

const DEFAULTS: PortalSettings = {
  price_tolerance_pct: 2,
  senior_approval_threshold: 10000,
};

export async function loadSettings(): Promise<PortalSettings> {
  const sql = getDb();
  const rows = await sql`SELECT key, value FROM settings`;
  const map = new Map(rows.map((r) => [r.key as string, r.value as string]));
  return {
    price_tolerance_pct: Number(
      map.get("price_tolerance_pct") ?? DEFAULTS.price_tolerance_pct
    ),
    senior_approval_threshold: Number(
      map.get("senior_approval_threshold") ?? DEFAULTS.senior_approval_threshold
    ),
  };
}

export const AP_RULES_TEXT = `Accounts payable rules for Orbis Manufacturing Ltd:

1. Match every supplier invoice to a valid purchase order before marking it as matched.
2. Do not pay duplicate invoices — the same invoice number from the same vendor may only be paid once.
3. Do not pay when the unit price differs from the PO by more than the configured tolerance (see Policy page).
4. Never change vendor bank details based on an email request; always escalate to a human approver through the vendor change request process.
5. Invoices whose total exceeds the senior approval threshold require senior approver sign-off on the payment request.
6. If the PO reference is missing, contact the requester and do not guess which PO applies.`;