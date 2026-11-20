import { formatUsd } from "./format";

export type MatchCheckInput = {
  poNumber: string | null;
  poExists: boolean;
  invoiceVendorId: number;
  poVendorId: number | null;
  invoiceUnitPrice: number;
  poUnitPrice: number | null;
  invoiceQuantity: number;
  poQuantity: number | null;
  invoiceNumber: string;
  vendorId: number;
  duplicateExists: boolean;
  totalAmount: number;
  priceTolerancePct: number;
  seniorApprovalThreshold: number;
};

export type CheckResult = {
  key: string;
  label: string;
  outcome: "PASS" | "FAIL" | "INFO";
  detail: string;
};

export function priceWithinTolerance(
  invoiceUnit: number,
  poUnit: number,
  tolerancePct: number
): boolean {
  if (poUnit <= 0) return false;
  const diffPct = (Math.abs(invoiceUnit - poUnit) / poUnit) * 100;
  return diffPct <= tolerancePct + 1e-9;
}

export function runMatchChecks(input: MatchCheckInput): CheckResult[] {
  const results: CheckResult[] = [];

  const poPresent = Boolean(input.poNumber?.trim());
  const poOk = poPresent && input.poExists;
  results.push({
    key: "po_reference",
    label: "PO reference present and the PO exists",
    outcome: poOk ? "PASS" : "FAIL",
    detail: poOk
      ? `PO ${input.poNumber} found.`
      : poPresent
        ? `PO ${input.poNumber} was not found.`
        : "No PO reference on invoice.",
  });

  const vendorOk =
    input.poVendorId !== null && input.invoiceVendorId === input.poVendorId;
  results.push({
    key: "vendor_match",
    label: "Vendor on the invoice equals the vendor on the PO",
    outcome: vendorOk ? "PASS" : "FAIL",
    detail: vendorOk
      ? "Vendor matches the purchase order."
      : "Vendor does not match the PO vendor.",
  });

  const priceOk =
    input.poUnitPrice !== null &&
    priceWithinTolerance(
      input.invoiceUnitPrice,
      input.poUnitPrice,
      input.priceTolerancePct
    );
  results.push({
    key: "unit_price",
    label: "Unit price within tolerance of the PO unit price",
    outcome: priceOk ? "PASS" : "FAIL",
    detail:
      input.poUnitPrice === null
        ? "No PO unit price to compare."
        : priceOk
          ? `Invoice unit ${formatUsd(input.invoiceUnitPrice)} is within ${input.priceTolerancePct}% of PO unit ${formatUsd(input.poUnitPrice)}.`
          : `Invoice unit ${formatUsd(input.invoiceUnitPrice)} is outside ${input.priceTolerancePct}% of PO unit ${formatUsd(input.poUnitPrice)}.`,
  });

  const qtyOk =
    input.poQuantity !== null && input.invoiceQuantity <= input.poQuantity;
  results.push({
    key: "quantity",
    label: "Quantity does not exceed the PO quantity",
    outcome: qtyOk ? "PASS" : "FAIL",
    detail:
      input.poQuantity === null
        ? "No PO quantity to compare."
        : qtyOk
          ? `Invoice quantity ${input.invoiceQuantity} is within PO quantity ${input.poQuantity}.`
          : `Invoice quantity ${input.invoiceQuantity} exceeds PO quantity ${input.poQuantity}.`,
  });

  const dupOk = !input.duplicateExists;
  results.push({
    key: "duplicate",
    label:
      "No other invoice with the same invoice number for this vendor (duplicate check)",
    outcome: dupOk ? "PASS" : "FAIL",
    detail: dupOk
      ? "No duplicate invoice number for this vendor."
      : "Another invoice with this number exists for this vendor.",
  });

  const senior =
    input.totalAmount > input.seniorApprovalThreshold + 1e-9;
  results.push({
    key: "senior_threshold",
    label: "Amount above the senior approval threshold (informational)",
    outcome: "INFO",
    detail: senior
      ? "Senior approval required"
      : `Amount $${formatUsd(input.totalAmount)} is at or below threshold $${formatUsd(input.seniorApprovalThreshold)}.`,
  });

  return results;
}

export function matchChecksPassForMarkMatched(results: CheckResult[]): boolean {
  const required = [
    "po_reference",
    "vendor_match",
    "unit_price",
    "quantity",
    "duplicate",
  ];
  return required.every(
    (k) => results.find((r) => r.key === k)?.outcome === "PASS"
  );
}