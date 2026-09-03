export const TRANSPORT_STATUS = {
  REQUESTED: "requested",
  SCHEDULED: "scheduled",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type TransportStatus =
  (typeof TRANSPORT_STATUS)[keyof typeof TRANSPORT_STATUS];

export const TRANSPORT_STATUS_VALUES = Object.values(TRANSPORT_STATUS);
