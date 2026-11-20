export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseDecimal(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error("Invalid number");
  }
  return Math.round(n * 100) / 100;
}