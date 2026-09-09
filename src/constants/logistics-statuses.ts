export const LOGISTICS_STATUS = {
  NOT_REQUIRED: "not_required",
  PENDING: "pending",
  REQUESTED: "requested",
  SCHEDULED: "scheduled",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
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
  in_transit: ["delivered"],
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
