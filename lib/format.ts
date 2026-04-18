/**
 * Shared formatting utilities used across pages and components.
 */

export function fmtCurrency(v: number): string {
  return v.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Not provided";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
