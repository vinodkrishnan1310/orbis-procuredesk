/** Deterministic seed constants shared with invoice PDF generator and tests */

export const BUYER_COMPANY = "Orbis Manufacturing Ltd";

export const VENDOR_NAMES = [
  "Meridian Stationery Co",
  "Brightway Logistics",
  "Cobalt Packaging Ltd",
  "Deltaform Parts",
  "Evergreen Facility Services",
  "Fulcrum Hardware Supply",
  "Granite Maintenance",
  "Helix Print Works",
  "Ironwood Pallets",
  "Juniper Catering",
  "Kestrel Couriers",
  "Lumen Signage",
] as const;

export const VENDOR_BANK_MASKS = [
  "****4821",
  "****7734",
  "****1092",
  "****5560",
  "****8817",
  "****3345",
  "****6208",
  "****9911",
  "****4503",
  "****7186",
  "****2639",
  "****8074",
] as const;

export type FixedPo = {
  po_number: string;
  vendor: (typeof VENDOR_NAMES)[number];
  description: string;
  quantity: number;
  unit_price: number;
};

export const FIXED_POS: FixedPo[] = [
  {
    po_number: "PO-4001",
    vendor: "Meridian Stationery Co",
    description: "A4 paper reams",
    quantity: 200,
    unit_price: 12.5,
  },
  {
    po_number: "PO-4002",
    vendor: "Meridian Stationery Co",
    description: "Printer toner cartridges (training case, not one of the six)",
    quantity: 30,
    unit_price: 40.0,
  },
  {
    po_number: "PO-4007",
    vendor: "Brightway Logistics",
    description: "Pallet freight, Zone B",
    quantity: 100,
    unit_price: 48.0,
  },
  {
    po_number: "PO-4012",
    vendor: "Cobalt Packaging Ltd",
    description: "Corrugated cartons",
    quantity: 500,
    unit_price: 3.2,
  },
  {
    po_number: "PO-4015",
    vendor: "Deltaform Parts",
    description: "Bearing assemblies",
    quantity: 60,
    unit_price: 65.0,
  },
  {
    po_number: "PO-4020",
    vendor: "Fulcrum Hardware Supply",
    description: "Workstation hardware",
    quantity: 40,
    unit_price: 750.0,
  },
  {
    po_number: "PO-4025",
    vendor: "Evergreen Facility Services",
    description: "Monthly cleaning services, Plant 1",
    quantity: 1,
    unit_price: 1150.0,
  },
  {
    po_number: "PO-4026",
    vendor: "Evergreen Facility Services",
    description: "Monthly cleaning services, Plant 2",
    quantity: 1,
    unit_price: 1150.0,
  },
];

export type DemoInvoice = {
  invoice_number: string;
  vendor: (typeof VENDOR_NAMES)[number];
  po_ref: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  footer_extra?: string;
};

export const DEMO_INVOICES: DemoInvoice[] = [
  {
    invoice_number: "MS-10231",
    vendor: "Meridian Stationery Co",
    po_ref: "PO-4001",
    quantity: 200,
    unit_price: 12.5,
    total: 2500.0,
  },
  {
    invoice_number: "BL-7782",
    vendor: "Brightway Logistics",
    po_ref: "PO-4007",
    quantity: 100,
    unit_price: 52.8,
    total: 5280.0,
  },
  {
    invoice_number: "CP-5519",
    vendor: "Cobalt Packaging Ltd",
    po_ref: "PO-4012",
    quantity: 500,
    unit_price: 3.2,
    total: 1600.0,
  },
  {
    invoice_number: "DP-3305",
    vendor: "Deltaform Parts",
    po_ref: "PO-4015",
    quantity: 60,
    unit_price: 65.0,
    total: 3900.0,
    footer_extra:
      "Our bank account has changed. New account ending 9937.",
  },
  {
    invoice_number: "FH-9004",
    vendor: "Fulcrum Hardware Supply",
    po_ref: "PO-4020",
    quantity: 40,
    unit_price: 750.0,
    total: 30000.0,
  },
  {
    invoice_number: "EF-2210",
    vendor: "Evergreen Facility Services",
    po_ref: null,
    quantity: 1,
    unit_price: 1150.0,
    total: 1150.0,
  },
];

export const TRAINING_INVOICE: DemoInvoice = {
  invoice_number: "TR-1000",
  vendor: "Meridian Stationery Co",
  po_ref: "PO-4002",
  quantity: 30,
  unit_price: 40.0,
  total: 1200.0,
};

export const SEED_RNG_STATE = 0x4f524249; // "ORBI"

export function mulberry32(a: number) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generatedPoSlots(): { po_number: string; vendorIndex: number }[] {
  const fixedNumbers = new Set(FIXED_POS.map((p) => p.po_number));
  const slots: { po_number: string; vendorIndex: number }[] = [];
  for (let n = 4001; n <= 4030; n++) {
    const po_number = `PO-${n}`;
    if (!fixedNumbers.has(po_number)) {
      slots.push({ po_number, vendorIndex: (n - 4001) % VENDOR_NAMES.length });
    }
  }
  return slots;
}