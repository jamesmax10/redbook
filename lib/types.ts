export interface Adjustment {
  factor: string;
  percentage: number;
  rationale: string;
}

export const FACTOR_OPTIONS = [
  { value: "location", label: "Location" },
  { value: "condition", label: "Condition" },
  { value: "size", label: "Size" },
  { value: "age", label: "Age" },
  { value: "specification", label: "Specification" },
  { value: "lease_terms", label: "Lease Terms" },
  { value: "parking", label: "Parking" },
  { value: "floor_level", label: "Floor Level" },
  { value: "market_movement", label: "Market Movement" },
  { value: "other", label: "Other" },
] as const;
