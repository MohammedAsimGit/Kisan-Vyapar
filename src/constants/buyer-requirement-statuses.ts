export const BUYER_REQUIREMENT_STATUS = {
  DRAFT: "draft",
  OPEN: "open",
  FULFILLED: "fulfilled",
  CANCELLED: "cancelled",
} as const;

export type BuyerRequirementStatus =
  (typeof BUYER_REQUIREMENT_STATUS)[keyof typeof BUYER_REQUIREMENT_STATUS];

export const BUYER_REQUIREMENT_STATUS_VALUES = Object.values(
  BUYER_REQUIREMENT_STATUS,
);
