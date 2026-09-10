export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  IN_TRANSIT: "in_transit",
  VENDOR_CONFIRMED_DELIVERY: "vendor_confirmed_delivery",
  FARMER_CONFIRMED_DELIVERY: "farmer_confirmed_delivery",
  DELIVERED: "delivered",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_CONFIRMED: "payment_confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed"],
  confirmed: ["in_transit", "cancelled"],
  in_transit: ["vendor_confirmed_delivery", "cancelled"],
  vendor_confirmed_delivery: ["farmer_confirmed_delivery", "cancelled"],
  farmer_confirmed_delivery: ["delivered", "payment_pending"],
  delivered: [],
  payment_pending: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionOrder(
  current: OrderStatus,
  target: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[current]?.includes(target) ?? false;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Order Confirmed",
  in_transit: "In Transit",
  vendor_confirmed_delivery: "Vendor Confirmed Delivery",
  farmer_confirmed_delivery: "Awaiting Farmer Confirmation",
  delivered: "Delivered",
  payment_pending: "Payment Pending",
  payment_confirmed: "Payment Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};
