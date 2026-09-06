export const OFFER_STATUS = {
  /** The farmer's latest proposal (offer or counter) awaits the vendor. */
  PENDING: "pending",
  /** The vendor's latest counter awaits the farmer. */
  COUNTERED: "countered",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
} as const;

export type OfferStatus = (typeof OFFER_STATUS)[keyof typeof OFFER_STATUS];

export const OFFER_STATUS_VALUES = Object.values(OFFER_STATUS);

/** Statuses in which the negotiation is still live (a response is awaited). */
export const ACTIVE_OFFER_STATUSES: OfferStatus[] = [
  OFFER_STATUS.PENDING,
  OFFER_STATUS.COUNTERED,
];

export const TERMINAL_OFFER_STATUSES: OfferStatus[] = [
  OFFER_STATUS.ACCEPTED,
  OFFER_STATUS.REJECTED,
  OFFER_STATUS.WITHDRAWN,
];

/**
 * Human-readable labels for offer lifecycle states. Mirrors the pattern used by
 * requirement statuses / quality grades so UI copy stays centralised.
 */
export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: "Pending",
  countered: "Countered",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};