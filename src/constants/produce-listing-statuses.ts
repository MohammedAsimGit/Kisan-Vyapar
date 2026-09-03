export const PRODUCE_LISTING_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  SOLD_OUT: "sold_out",
  WITHDRAWN: "withdrawn",
} as const;

export type ProduceListingStatus =
  (typeof PRODUCE_LISTING_STATUS)[keyof typeof PRODUCE_LISTING_STATUS];

export const PRODUCE_LISTING_STATUS_VALUES = Object.values(PRODUCE_LISTING_STATUS);
