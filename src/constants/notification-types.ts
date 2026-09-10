export const NOTIFICATION_TYPE = {
  CROP_MATCH: "crop_match",
  NEW_OFFER: "new_offer",
  COUNTER_OFFER: "counter_offer",
  OFFER_ACCEPTED: "offer_accepted",
  OFFER_REJECTED: "offer_rejected",
  OFFER_WITHDRAWN: "offer_withdrawn",
  NEGOTIATION_EXPIRED: "negotiation_expired",

  ORDER_CREATED: "order_created",
  ORDER_CANCELLED: "order_cancelled",

  LOGISTICS_SCHEDULED: "logistics_scheduled",
  PICKUP_SCHEDULED: "pickup_scheduled",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  VENDOR_DELIVERY_CONFIRMED: "vendor_delivery_confirmed",
  FARMER_DELIVERY_CONFIRMED: "farmer_delivery_confirmed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  PAYMENT_PENDING: "payment_pending",

  REQUIREMENT_MATCH: "requirement_match",
  REQUIREMENT_EXPIRING: "requirement_expiring",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

export const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPE);

/** Maps a notification type to its icon and human label. */
export const NOTIFICATION_META: Record<
  NotificationType,
  { label: string; icon: string }
> = {
  crop_match: { label: "New Crop Match", icon: "🌾" },
  new_offer: { label: "New Offer", icon: "💰" },
  counter_offer: { label: "Counter Offer", icon: "💬" },
  offer_accepted: { label: "Offer Accepted", icon: "✅" },
  offer_rejected: { label: "Offer Rejected", icon: "❌" },
  offer_withdrawn: { label: "Offer Withdrawn", icon: "↩️" },
  negotiation_expired: { label: "Negotiation Expired", icon: "⏰" },
  order_created: { label: "Order Created", icon: "📦" },
  order_cancelled: { label: "Order Cancelled", icon: "📦" },
  logistics_scheduled: { label: "Transport Scheduled", icon: "🚚" },
  pickup_scheduled: { label: "Pickup Scheduled", icon: "📍" },
  in_transit: { label: "In Transit", icon: "🚚" },
  delivered: { label: "Delivered", icon: "✅" },
  vendor_delivery_confirmed: { label: "Delivery Confirmed by Buyer", icon: "📦" },
  farmer_delivery_confirmed: { label: "Delivery Confirmed", icon: "✅" },
  payment_confirmed: { label: "Payment Confirmed", icon: "💰" },
  payment_pending: { label: "Payment Pending", icon: "💳" },

  requirement_match: { label: "New Farmer Match", icon: "🌾" },
  requirement_expiring: { label: "Requirement Expiring", icon: "⏰" },
};

/** Derive a route from an entity type + id for a given role. */
export function getNotificationDestination(
  entityType: string,
  entityId: string,
  role: "farmer" | "vendor",
): string {
  switch (entityType) {
    case "offer":
      return role === "farmer"
        ? `/farmer/offers/${entityId}`
        : `/vendor/offers/${entityId}`;
    case "order":
      return role === "farmer"
        ? `/farmer/orders/${entityId}`
        : `/vendor/orders/${entityId}`;
    case "logistics":
      return role === "farmer"
        ? `/farmer/orders/${entityId}`
        : `/vendor/orders/${entityId}`;
    case "produce":
      return `/farmer/produce`;
    case "requirement":
      return role === "vendor"
        ? `/vendor/requirements`
        : `/farmer/requirements`;
    default:
      return role === "farmer" ? "/farmer" : "/vendor";
  }
}
