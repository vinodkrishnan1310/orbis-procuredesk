import { getDb } from "./db";
import {
  VENDOR_NAMES,
  VENDOR_BANK_MASKS,
  FIXED_POS,
  generatedPoSlots,
  mulberry32,
  SEED_RNG_STATE,
} from "./seed-data";

const BANK_CHANGED_BASE = new Date("2024-01-15T00:00:00Z");

export async function truncateAndSeed(): Promise<void> {
  const sql = getDb();
  await sql`TRUNCATE TABLE
    audit_log,
    vendor_change_requests,
    payment_requests,
    invoices,
    purchase_orders,
    vendors,
    users,
    settings
    RESTART IDENTITY CASCADE`;

  await sql`
    INSERT INTO settings (key, value) VALUES
      ('price_tolerance_pct', '2'),
      ('senior_approval_threshold', '10000')
  `;

  await sql`
    INSERT INTO users (username, role) VALUES
      ('ap.clerk', 'ap.clerk'),
      ('finance.approver', 'finance.approver'),
      ('senior.approver', 'senior.approver')
  `;

  for (let i = 0; i < VENDOR_NAMES.length; i++) {
    const changed = new Date(BANK_CHANGED_BASE);
    changed.setUTCDate(changed.getUTCDate() - (200 + i * 7));
    await sql`
      INSERT INTO vendors (name, bank_account_masked, bank_last_changed)
      VALUES (${VENDOR_NAMES[i]}, ${VENDOR_BANK_MASKS[i]}, ${changed.toISOString().slice(0, 10)})
    `;
  }

  const vendorRows = await sql`SELECT id, name FROM vendors ORDER BY id`;
  const vendorByName = new Map(
    vendorRows.map((v) => [v.name as string, v.id as number])
  );

  async function insertPo(
    po_number: string,
    vendorName: string,
    description: string,
    quantity: number,
    unit_price: number
  ) {
    const vendor_id = vendorByName.get(vendorName)!;
    const total = Math.round(quantity * unit_price * 100) / 100;
    await sql`
      INSERT INTO purchase_orders (po_number, vendor_id, description, quantity, unit_price, total, status)
      VALUES (${po_number}, ${vendor_id}, ${description}, ${quantity}, ${unit_price}, ${total}, 'Open')
    `;
  }

  for (const po of FIXED_POS) {
    await insertPo(
      po.po_number,
      po.vendor,
      po.description,
      po.quantity,
      po.unit_price
    );
  }

  const rand = mulberry32(SEED_RNG_STATE);
  const descriptions = [
    "General supplies",
    "Maintenance parts",
    "Shipping materials",
    "Office consumables",
    "Safety equipment",
    "Production consumables",
    "Facility repair",
    "Printed materials",
    "Pallet stock",
    "Catering services",
    "Courier services",
    "Signage refresh",
  ];

  for (const slot of generatedPoSlots()) {
    const vendorName = VENDOR_NAMES[slot.vendorIndex];
    let quantity = 5 + Math.floor(rand() * 396);
    let unit_price = 2 + rand() * 898;
    unit_price = Math.round(unit_price * 100) / 100;
    let total = Math.round(quantity * unit_price * 100) / 100;
    let guard = 0;
    while (total >= 10000 && guard < 50) {
      quantity = 5 + Math.floor(rand() * 100);
      unit_price = 2 + rand() * 50;
      unit_price = Math.round(unit_price * 100) / 100;
      total = Math.round(quantity * unit_price * 100) / 100;
      guard++;
    }
    const desc = descriptions[slot.vendorIndex];
    await insertPo(slot.po_number, vendorName, desc, quantity, unit_price);
  }

  const po4012 = await sql`
    SELECT id FROM purchase_orders WHERE po_number = 'PO-4012'
  `;
  const cobaltId = vendorByName.get("Cobalt Packaging Ltd")!;
  await sql`
    INSERT INTO invoices (
      invoice_number, vendor_id, po_id, po_ref_text, quantity, unit_price, total,
      status, invoice_date, notes
    ) VALUES (
      'CP-5519', ${cobaltId}, ${po4012[0].id as number}, 'PO-4012',
      500, 3.2, 1600.00,
      'Paid', '2025-06-01', 'Seed paid invoice for duplicate demo.'
    )
  `;
}