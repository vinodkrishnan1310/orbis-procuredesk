import { describe, expect, it } from "vitest";
import {
  matchChecksPassForMarkMatched,
  priceWithinTolerance,
  runMatchChecks,
  type MatchCheckInput,
} from "./match-check";

const BASE: MatchCheckInput = {
  poNumber: "PO-4001",
  poExists: true,
  invoiceVendorId: 1,
  poVendorId: 1,
  invoiceUnitPrice: 12.5,
  poUnitPrice: 12.5,
  invoiceQuantity: 200,
  poQuantity: 200,
  invoiceNumber: "MS-10231",
  vendorId: 1,
  duplicateExists: false,
  totalAmount: 2500,
  priceTolerancePct: 2,
  seniorApprovalThreshold: 10000,
};

describe("priceWithinTolerance", () => {
  it("passes at exactly 2% over", () => {
    expect(priceWithinTolerance(12.75, 12.5, 2)).toBe(true);
  });
  it("fails just over 2%", () => {
    expect(priceWithinTolerance(12.76, 12.5, 2)).toBe(false);
  });
});

describe("six demo cases", () => {
  it("MS-10231 clean match", () => {
    const results = runMatchChecks({ ...BASE });
    expect(matchChecksPassForMarkMatched(results)).toBe(true);
    expect(results.find((r) => r.key === "senior_threshold")?.detail).not.toBe(
      "Senior approval required"
    );
  });

  it("BL-7782 price variance", () => {
    const results = runMatchChecks({
      ...BASE,
      poNumber: "PO-4007",
      invoiceNumber: "BL-7782",
      invoiceUnitPrice: 52.8,
      poUnitPrice: 48,
      invoiceQuantity: 100,
      poQuantity: 100,
      totalAmount: 5280,
    });
    expect(results.find((r) => r.key === "unit_price")?.outcome).toBe("FAIL");
    expect(matchChecksPassForMarkMatched(results)).toBe(false);
  });

  it("CP-5519 duplicate", () => {
    const results = runMatchChecks({
      ...BASE,
      poNumber: "PO-4012",
      invoiceNumber: "CP-5519",
      invoiceUnitPrice: 3.2,
      poUnitPrice: 3.2,
      invoiceQuantity: 500,
      poQuantity: 500,
      totalAmount: 1600,
      duplicateExists: true,
    });
    expect(results.find((r) => r.key === "duplicate")?.outcome).toBe("FAIL");
  });

  it("DP-3305 amounts match", () => {
    const results = runMatchChecks({
      ...BASE,
      poNumber: "PO-4015",
      invoiceNumber: "DP-3305",
      invoiceUnitPrice: 65,
      poUnitPrice: 65,
      invoiceQuantity: 60,
      poQuantity: 60,
      totalAmount: 3900,
    });
    expect(matchChecksPassForMarkMatched(results)).toBe(true);
  });

  it("FH-9004 above threshold", () => {
    const results = runMatchChecks({
      ...BASE,
      poNumber: "PO-4020",
      invoiceNumber: "FH-9004",
      invoiceUnitPrice: 750,
      poUnitPrice: 750,
      invoiceQuantity: 40,
      poQuantity: 40,
      totalAmount: 30000,
    });
    expect(matchChecksPassForMarkMatched(results)).toBe(true);
    expect(results.find((r) => r.key === "senior_threshold")?.detail).toBe(
      "Senior approval required"
    );
  });

  it("EF-2210 missing PO", () => {
    const results = runMatchChecks({
      ...BASE,
      poNumber: null,
      poExists: false,
      poVendorId: null,
      poUnitPrice: null,
      poQuantity: null,
      invoiceNumber: "EF-2210",
      invoiceUnitPrice: 1150,
      invoiceQuantity: 1,
      totalAmount: 1150,
    });
    expect(results.find((r) => r.key === "po_reference")?.outcome).toBe("FAIL");
    expect(matchChecksPassForMarkMatched(results)).toBe(false);
  });
});

describe("senior threshold boundary", () => {
  it("at threshold is informational only", () => {
    const results = runMatchChecks({ ...BASE, totalAmount: 10000 });
    const info = results.find((r) => r.key === "senior_threshold");
    expect(info?.detail).not.toBe("Senior approval required");
  });
  it("above threshold shows senior message", () => {
    const results = runMatchChecks({ ...BASE, totalAmount: 10000.01 });
    expect(results.find((r) => r.key === "senior_threshold")?.detail).toBe(
      "Senior approval required"
    );
  });
});