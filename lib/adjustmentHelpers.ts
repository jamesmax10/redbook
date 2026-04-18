import type { Adjustment } from "@/lib/types";

export const TRANSACTION_TYPE_OPTIONS = [
  "Sale",
  "Letting",
  "Rent Review",
  "Lease Renewal",
];

export function emptyAdjustment(): Adjustment {
  return { factor: "location", percentage: 0, rationale: "" };
}
