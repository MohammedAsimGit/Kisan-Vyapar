export const LOGISTICS_STATUS = {
  NOT_REQUIRED: "not_required",
  PENDING: "pending",
  REQUESTED: "requested",
  SCHEDULED: "scheduled",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  VENDOR_DELIVERY_PENDING: "vendor_delivery_pending",
  FARMER_DELIVERY_PENDING: "farmer_delivery_pending",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type LogisticsStatus =
  (typeof LOGISTICS_STATUS)[keyof typeof LOGISTICS_STATUS];

export const LOGISTICS_STATUS_VALUES = Object.values(LOGISTICS_STATUS);

/**
 * Valid state transitions for logistics.
 * Source → Set of valid targets.
 */
export const LOGISTICS_TRANSITIONS: Record<LogisticsStatus, LogisticsStatus[]> = {
  not_required: ["pending"],
  pending: ["requested", "cancelled"],
  requested: ["scheduled", "cancelled"],
  scheduled: ["picked_up", "cancelled"],
  picked_up: ["in_transit"],
  in_transit: ["vendor_delivery_pending"],
  vendor_delivery_pending: ["farmer_delivery_pending"],
  farmer_delivery_pending: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function canTransitionLogistics(
  current: LogisticsStatus,
  target: LogisticsStatus,
): boolean {
  return LOGISTICS_TRANSITIONS[current]?.includes(target) ?? false;
}

export const LOGISTICS_STATUS_LABELS: Record<LogisticsStatus, string> = {
  not_required: "Not Required",
  pending: "Pending",
  requested: "Requested",
  scheduled: "Scheduled",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  vendor_delivery_pending: "Waiting for Farmer Confirmation",
  farmer_delivery_pending: "Delivery Pending Farmer Confirmation",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Steps shown in the farmer/vendor tracking timeline.
 * Each entry maps a status to a human-readable label.
 */
export const LOGISTICS_TIMELINE_STEPS: LogisticsStatus[] = [
  "scheduled",
  "picked_up",
  "in_transit",
  "delivered",
];

export const LOGISTICS_DELIVERY_STEPS = [
  "vendor_delivery_pending",
  "farmer_delivery_pending",
] as const;
