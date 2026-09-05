export const BUYER_REQUIREMENT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  FULFILLED: "fulfilled",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;

export type BuyerRequirementStatus =
  (typeof BUYER_REQUIREMENT_STATUS)[keyof typeof BUYER_REQUIREMENT_STATUS];

export const BUYER_REQUIREMENT_STATUS_VALUES = Object.values(
  BUYER_REQUIREMENT_STATUS,
);

/**
 * Human-readable labels for requirement lifecycle states. Mirrors the pattern
 * used by quality grades / vendor business types so UI copy stays centralised.
 */
export const BUYER_REQUIREMENT_STATUS_LABELS: Record<
  BuyerRequirementStatus,
  string
> = {
  active: "Active",
  paused: "Paused",
  fulfilled: "Fulfilled",
  expired: "Expired",
  cancelled: "Cancelled",
};
