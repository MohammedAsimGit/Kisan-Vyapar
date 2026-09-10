import "server-only";
import { connectToDatabase } from "@/lib/db";
import type { Types } from "mongoose";
import {
  FarmerProfileModel,
  LogisticsModel,
  OrderModel,
  UserModel,
  VendorProfileModel,
} from "@/models";
import type { Order } from "@/models/order";
import type { Logistics as LogisticsDoc } from "@/models/logistics";
import {
  LOGISTICS_STATUS,
  LOGISTICS_STATUS_LABELS,
  LOGISTICS_STATUS_VALUES,
  LOGISTICS_TIMELINE_STEPS,
  canTransitionLogistics,
  type LogisticsStatus,
} from "@/constants/logistics-statuses";
import { ORDER_STATUS } from "@/constants/order-statuses";
import type { MeasurementUnit } from "@/constants/measurement-units";
import { ConflictError, NotFoundError, AuthorizationError } from "@/lib/errors";
import { createNotification } from "@/features/notifications/notification-service";
import { type NotificationType } from "@/constants/notification-types";
import { parseOrThrow } from "@/lib/validation";
import { z } from "zod";
import type { GeoPoint, PostalAddress } from "@/types/geo";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface LogisticsActor {
  role: "farmer" | "vendor";
  profileId: string;
}

export interface LogisticsView {
  id: string;
  orderId: string;
  orderNumber: string;
  status: LogisticsStatus;
  statusLabel: string;
  quantity: number;
  unit: MeasurementUnit;
  currency: string;
  cropName: string;
  farmer: { profileId: string; name?: string };
  vendor: { profileId: string; businessName?: string };
  pickup: {
    label?: string;
    address?: PostalAddress;
    coordinatesAvailable: boolean;
  };
  delivery: {
    label?: string;
    address?: PostalAddress;
    coordinatesAvailable: boolean;
  };
  distanceKm: number | null;
  vehicleType?: string;
  estimatedTransportCost: number | null;
  pickupScheduledAt?: string;
  estimatedDeliveryAt?: string;
  /** The step-level timeline shown in the tracking UI. */
  timeline: Array<{
    status: LogisticsStatus;
    label: string;
    reached: boolean;
    current: boolean;
  }>;
  netRealization?: {
    grossValue: number;
    estimatedTransportCost: number;
    netValue: number;
    netPerUnit: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

export const createLogisticsSchema = z.object({
  orderId: z.string().min(1),
  pickup: z
    .object({
      label: z.string().max(200).optional(),
      geo: z
        .object({
          type: z.literal("Point"),
          coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
      address: z
        .object({
          line: z.string().max(300).optional(),
          village: z.string().max(120).optional(),
          district: z.string().max(120).optional(),
          state: z.string().max(120).optional(),
          pincode: z.string().max(20).optional(),
          country: z.string().max(2).optional(),
        })
        .optional(),
    })
    .optional(),
  delivery: z
    .object({
      label: z.string().max(200).optional(),
      geo: z
        .object({
          type: z.literal("Point"),
          coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
      address: z
        .object({
          line: z.string().max(300).optional(),
          village: z.string().max(120).optional(),
          district: z.string().max(120).optional(),
          state: z.string().max(120).optional(),
          pincode: z.string().max(20).optional(),
          country: z.string().max(2).optional(),
        })
        .optional(),
    })
    .optional(),
  vehicleType: z.string().max(80).optional(),
  pickupScheduledAt: z.string().datetime().optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const updateLogisticsSchema = z.object({
  pickup: z
    .object({
      label: z.string().max(200).optional(),
      geo: z
        .object({
          type: z.literal("Point"),
          coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
      address: z
        .object({
          line: z.string().max(300).optional(),
          village: z.string().max(120).optional(),
          district: z.string().max(120).optional(),
          state: z.string().max(120).optional(),
          pincode: z.string().max(20).optional(),
          country: z.string().max(2).optional(),
        })
        .optional(),
    })
    .optional(),
  delivery: z
    .object({
      label: z.string().max(200).optional(),
      geo: z
        .object({
          type: z.literal("Point"),
          coordinates: z.tuple([z.number(), z.number()]),
        })
        .optional(),
      address: z
        .object({
          line: z.string().max(300).optional(),
          village: z.string().max(120).optional(),
          district: z.string().max(120).optional(),
          state: z.string().max(120).optional(),
          pincode: z.string().max(20).optional(),
          country: z.string().max(2).optional(),
        })
        .optional(),
    })
    .optional(),
  vehicleType: z.string().max(80).optional(),
  pickupScheduledAt: z.string().datetime().optional(),
  estimatedDeliveryAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const transitionLogisticsSchema = z.object({
  status: z.enum(LOGISTICS_STATUS_VALUES as [string, ...string[]]),
});

/* -------------------------------------------------------------------------- */
/* Distance & Cost Estimation                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Haversine distance between two GeoPoints in km.
 * Returns null if either point is missing or coordinates are invalid.
 */
export function haversineDistanceKm(
  a?: GeoPoint | null,
  b?: GeoPoint | null,
): number | null {
  if (!a?.coordinates || !b?.coordinates) return null;
  const [lon1, lat1] = a.coordinates;
  const [lon2, lat2] = b.coordinates;
  if (
    typeof lon1 !== "number" ||
    typeof lat1 !== "number" ||
    typeof lon2 !== "number" ||
    typeof lat2 !== "number"
  ) {
    return null;
  }
  // Avoid dummy coordinates
  if (
    (lon1 === 0 && lat1 === 0) ||
    (lon2 === 0 && lat2 === 0)
  ) {
    return null;
  }

  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
}

/**
 * Estimated transport cost in INR based on distance and vehicle type.
 * Rates are indicative industry averages — NOT guaranteed quotes.
 */
export function estimateTransportCost(
  distanceKm: number | null,
  vehicleType: string | undefined,
  quantity: number,
  unit: MeasurementUnit,
): number | null {
  if (distanceKm === null || distanceKm <= 0) return null;

  // Convert to approximate quintals for rate calculation
  const QUINTAL_FACTOR: Record<MeasurementUnit, number> = {
    kg: 0.01,
    quintal: 1,
    tonne: 10,
  };
  const approxQuintals = quantity * (QUINTAL_FACTOR[unit] ?? 1);

  // Indicative per-km rates in INR (NOT guaranteed — labelled as estimates)
  const BASE_RATE_PER_KM: Record<string, number> = {
    "tempo": 12,
    "mini_truck": 18,
    "medium_truck": 28,
    "large_truck": 40,
    "trailer": 55,
  };

  const rate = BASE_RATE_PER_KM[vehicleType ?? "medium_truck"] ?? 28;

  // Base cost + quantity surcharge
  const base = distanceKm * rate;
  const quantitySurcharge = approxQuintals * 25; // ₹25/quintal approx handling

  return Math.round((base + quantitySurcharge) * 100) / 100;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

async function farmerNameOf(profileId: string): Promise<string | undefined> {
  const profile = await FarmerProfileModel.findById(profileId)
    .select({ user: 1 })
    .lean();
  if (!profile?.user) return undefined;
  const user = await UserModel.findById(profile.user)
    .select({ fullName: 1 })
    .lean();
  return user?.fullName || undefined;
}

async function vendorNameOf(profileId: string): Promise<string | undefined> {
  const profile = await VendorProfileModel.findById(profileId)
    .select({ businessName: 1 })
    .lean();
  return profile?.businessName || undefined;
}

function buildTimeline(
  currentStatus: LogisticsStatus,
): LogisticsView["timeline"] {
  return LOGISTICS_TIMELINE_STEPS.map((s) => ({
    status: s,
    label: LOGISTICS_STATUS_LABELS[s],
    reached: LOGISTICS_TIMELINE_STEPS.indexOf(s) < LOGISTICS_TIMELINE_STEPS.indexOf(currentStatus),
    current: s === currentStatus,
  }));
}



async function buildLogisticsView(doc: LeanLogisticsDoc): Promise<LogisticsView> {
  const [farmerName, businessName] = await Promise.all([
    farmerNameOf(String(doc.farmerId)),
    vendorNameOf(String(doc.vendorId)),
  ]);

  const status = doc.status as LogisticsStatus;
  const distanceKm = haversineDistanceKm(doc.pickup?.geo, doc.delivery?.geo);

  const timeline = buildTimeline(status);

  // Net realization (only meaningful when transport cost is available)
  let netRealization: LogisticsView["netRealization"] | undefined;
  if (doc.estimatedTransportCost != null) {
    const order = await OrderModel.findById(doc.orderId)
      .select({ totalValue: 1 })
      .lean();
    if (order) {
      const transportCost = doc.estimatedTransportCost;
      const netValue = order.totalValue - transportCost;
      netRealization = {
        grossValue: order.totalValue,
        estimatedTransportCost: transportCost,
        netValue,
        netPerUnit: Math.round((netValue / doc.quantity) * 100) / 100,
      };
    }
  }

  return {
    id: String(doc._id),
    orderId: String(doc.orderId),
    orderNumber: "", // filled by caller if needed
    status,
    statusLabel: LOGISTICS_STATUS_LABELS[status],
    quantity: doc.quantity,
    unit: doc.unit,
    currency: doc.currency ?? "INR",
    cropName: doc.cropName ?? "Unknown",
    farmer: { profileId: String(doc.farmerId), name: farmerName },
    vendor: { profileId: String(doc.vendorId), businessName },
    pickup: {
      label: doc.pickup?.label,
      address: doc.pickup?.address,
      coordinatesAvailable: Boolean(
        doc.pickup?.geo?.coordinates?.length === 2,
      ),
    },
    delivery: {
      label: doc.delivery?.label,
      address: doc.delivery?.address,
      coordinatesAvailable: Boolean(
        doc.delivery?.geo?.coordinates?.length === 2,
      ),
    },
    distanceKm,
    vehicleType: doc.vehicleType,
    estimatedTransportCost: doc.estimatedTransportCost ?? null,
    pickupScheduledAt: doc.pickupScheduledAt?.toISOString(),
    estimatedDeliveryAt: doc.estimatedDeliveryAt?.toISOString(),
    timeline,
    netRealization,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Ownership guard                                                             */
/* -------------------------------------------------------------------------- */

type LeanLogisticsDoc = LogisticsDoc & { _id: Types.ObjectId };

async function findOwnedLogistics(
  actor: LogisticsActor,
  logisticsId: string,
): Promise<LeanLogisticsDoc | null> {
  await connectToDatabase();
  const filter =
    actor.role === "farmer"
      ? { _id: logisticsId, farmerId: actor.profileId }
      : { _id: logisticsId, vendorId: actor.profileId };
  const doc = await LogisticsModel.findOne(filter).lean();
  return doc ? (doc as unknown as LeanLogisticsDoc) : null;
}

async function findLogisticsByOrder(
  orderId: string,
): Promise<LeanLogisticsDoc | null> {
  await connectToDatabase();
  const doc = await LogisticsModel.findOne({ orderId }).lean();
  return doc ? (doc as unknown as LeanLogisticsDoc) : null;
}

/* -------------------------------------------------------------------------- */
/* CRUD                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Creates a logistics record from a confirmed order.
 * Only farmers can create logistics — the farmer arranges transportation.
 * Vendor can only view (read-only).
 */
export async function createLogistics(
  actor: LogisticsActor,
  input: unknown,
): Promise<LogisticsView> {
  if (actor.role !== "farmer") {
    throw new AuthorizationError(
      "Only the farmer can arrange transportation. Vendors can view transportation details but cannot create or edit them.",
    );
  }

  const validated = parseOrThrow(createLogisticsSchema, input);
  await connectToDatabase();

  // Find the order and verify ownership
  const orderDoc = await OrderModel.findById(validated.orderId).lean() as (Order & { _id: Types.ObjectId }) | null;
  if (!orderDoc) {
    throw new NotFoundError("Order not found.");
  }
  const order = orderDoc;

  const isFarmer = actor.role === "farmer" && String(order.seller) === actor.profileId;
  if (!isFarmer) {
    throw new ConflictError("You are not a party to this order.");
  }

  if (order.status !== ORDER_STATUS.CONFIRMED) {
    throw new ConflictError("Logistics can only be arranged for confirmed orders.");
  }

  // Prevent duplicate logistics for same order
  const existing = await LogisticsModel.exists({ orderId: order._id });
  if (existing) {
    throw new ConflictError("Logistics has already been set up for this order.");
  }

  // Resolve locations: prefer user-provided, fall back to order defaults
  const pickup = validated.pickup ?? order.pickupLocation ?? {};
  const delivery = validated.delivery ?? order.deliveryLocation ?? {};

  const distanceKm = haversineDistanceKm(pickup.geo, delivery.geo);
  const vehicleType = validated.vehicleType ?? "medium_truck";
  const estimatedTransportCost = estimateTransportCost(
    distanceKm,
    vehicleType,
    order.quantity,
    order.unit as MeasurementUnit,
  );

  const doc = await LogisticsModel.create({
    orderId: order._id,
    farmerId: order.seller,
    vendorId: order.buyer,
    quantity: order.quantity,
    unit: order.unit,
    currency: order.currency ?? "INR",
    cropName: order.cropName ?? "Unknown",
    pickup,
    delivery,
    distanceKm,
    vehicleType,
    estimatedTransportCost,
    pickupScheduledAt: validated.pickupScheduledAt
      ? new Date(validated.pickupScheduledAt)
      : undefined,
    estimatedDeliveryAt: validated.estimatedDeliveryAt
      ? new Date(validated.estimatedDeliveryAt)
      : undefined,
    status: LOGISTICS_STATUS.PENDING,
    notes: validated.notes,
  });

  return buildLogisticsView(doc);
}

export async function getLogisticsForFarmer(
  farmerProfileId: string,
  logisticsId: string,
): Promise<LogisticsView | null> {
  const doc = await findOwnedLogistics(
    { role: "farmer", profileId: farmerProfileId },
    logisticsId,
  );
  if (!doc) return null;
  return buildLogisticsView(doc);
}

export async function getLogisticsForVendor(
  vendorProfileId: string,
  logisticsId: string,
): Promise<LogisticsView | null> {
  const doc = await findOwnedLogistics(
    { role: "vendor", profileId: vendorProfileId },
    logisticsId,
  );
  if (!doc) return null;
  return buildLogisticsView(doc);
}

export async function getLogisticsByOrder(
  actor: LogisticsActor,
  orderId: string,
): Promise<LogisticsView | null> {
  const order = await OrderModel.findById(orderId).lean();
  if (!order) return null;

  const isFarmer = actor.role === "farmer" && String(order.seller) === actor.profileId;
  const isVendor = actor.role === "vendor" && String(order.buyer) === actor.profileId;
  if (!isFarmer && !isVendor) return null;

  const doc = await findLogisticsByOrder(orderId);
  if (!doc) return null;
  return buildLogisticsView(doc);
}

export async function listFarmerLogistics(
  farmerProfileId: string,
  opts?: { status?: LogisticsStatus; page?: number; limit?: number },
): Promise<{ items: LogisticsView[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;
  await connectToDatabase();
  const filter: Record<string, unknown> = { farmerId: farmerProfileId };
  if (opts?.status) filter.status = opts.status;
  const total = await LogisticsModel.countDocuments(filter);
  const docs = await LogisticsModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const items = await Promise.all(docs.map(buildLogisticsView));
  return { items, total };
}

export async function listVendorLogistics(
  vendorProfileId: string,
  opts?: { status?: LogisticsStatus; page?: number; limit?: number },
): Promise<{ items: LogisticsView[]; total: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;
  await connectToDatabase();
  const filter: Record<string, unknown> = { vendorId: vendorProfileId };
  if (opts?.status) filter.status = opts.status;
  const total = await LogisticsModel.countDocuments(filter);
  const docs = await LogisticsModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const items = await Promise.all(docs.map(buildLogisticsView));
  return { items, total };
}

/* -------------------------------------------------------------------------- */
/* Updates                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Updates a logistics record.
 * Only farmers can update — the farmer manages transportation.
 * Vendor can only view (read-only).
 */
export async function updateLogistics(
  actor: LogisticsActor,
  logisticsId: string,
  input: unknown,
): Promise<LogisticsView> {
  if (actor.role !== "vendor") {
    throw new AuthorizationError(
      "Only the farmer can update transportation details. Vendors can view but cannot edit.",
    );
  }

  const validated = parseOrThrow(updateLogisticsSchema, input);
  const doc = await findOwnedLogistics(actor, logisticsId);
  if (!doc) {
    throw new NotFoundError("Logistics record not found.");
  }
  if (doc.status === LOGISTICS_STATUS.DELIVERED || doc.status === LOGISTICS_STATUS.CANCELLED) {
    throw new ConflictError("Cannot update delivered or cancelled logistics.");
  }

  const update: Record<string, unknown> = {};
  if (validated.pickup) update.pickup = validated.pickup;
  if (validated.delivery) update.delivery = validated.delivery;
  if (validated.vehicleType) update.vehicleType = validated.vehicleType;
  if (validated.pickupScheduledAt)
    update.pickupScheduledAt = new Date(validated.pickupScheduledAt);
  if (validated.estimatedDeliveryAt)
    update.estimatedDeliveryAt = new Date(validated.estimatedDeliveryAt);
  if (validated.notes !== undefined) update.notes = validated.notes;

  if (Object.keys(update).length === 0) {
    throw new ConflictError("No updates provided.");
  }

  // Recalculate distance and cost if locations changed
  const pickup = validated.pickup ?? doc.pickup;
  const delivery = validated.delivery ?? doc.delivery;
  if (validated.pickup || validated.delivery) {
    const newDistance = haversineDistanceKm(pickup?.geo, delivery?.geo);
    if (newDistance !== null) {
      update.distanceKm = newDistance;
      update.estimatedTransportCost = estimateTransportCost(
        newDistance,
        validated.vehicleType ?? doc.vehicleType,
        doc.quantity,
        doc.unit as MeasurementUnit,
      );
    }
  }

  const updated = await LogisticsModel.findOneAndUpdate(
    { _id: logisticsId, status: { $nin: [LOGISTICS_STATUS.DELIVERED, LOGISTICS_STATUS.CANCELLED] } },
    { $set: update },
    { new: true },
  ).lean();
  if (!updated) {
    throw new NotFoundError("Logistics record could not be updated.");
  }
  return buildLogisticsView(updated);
}

/**
 * Transitions logistics status.
 * Only farmers can transition logistics status.
 * Vendor can only view.
 */
export async function transitionLogisticsStatus(
  actor: LogisticsActor,
  logisticsId: string,
  input: unknown,
): Promise<LogisticsView> {
  if (actor.role === "vendor") {
    throw new AuthorizationError(
      "Vendors cannot transition logistics status. Only farmers can manage transportation status.",
    );
  }

  const validated = parseOrThrow(transitionLogisticsSchema, input);
  const doc = await findOwnedLogistics(actor, logisticsId);
  if (!doc) {
    throw new NotFoundError("Logistics record not found.");
  }

  const currentStatus = doc.status as LogisticsStatus;
  const targetStatus = validated.status as LogisticsStatus;
  if (!canTransitionLogistics(currentStatus, targetStatus)) {
    throw new ConflictError(
      `Cannot transition from ${LOGISTICS_STATUS_LABELS[currentStatus]} to ${LOGISTICS_STATUS_LABELS[targetStatus]}.`,
    );
  }

  // Validate order is in appropriate state for pickup/delivery transitions
  if (targetStatus === LOGISTICS_STATUS.PICKED_UP || targetStatus === LOGISTICS_STATUS.IN_TRANSIT) {
    const order = await OrderModel.findById(doc.orderId)
      .select({ status: 1 })
      .lean();
    if (order && (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.COMPLETED)) {
      throw new ConflictError("The associated order has been cancelled or completed.");
    }
  }

  const updated = await LogisticsModel.findOneAndUpdate(
    { _id: logisticsId, status: doc.status },
    { $set: { status: targetStatus } },
    { new: true },
  ).lean();
  if (!updated) {
    throw new ConflictError(
      "Logistics status changed while updating. Please refresh.",
    );
  }

  // Sync order status with logistics transitions
  if (targetStatus === LOGISTICS_STATUS.PICKED_UP) {
    await OrderModel.findOneAndUpdate(
      { _id: doc.orderId, status: ORDER_STATUS.CONFIRMED },
      { $set: { status: ORDER_STATUS.IN_TRANSIT } },
    );
  }
  if (targetStatus === LOGISTICS_STATUS.VENDOR_DELIVERY_PENDING) {
    await OrderModel.findOneAndUpdate(
      { _id: doc.orderId, status: ORDER_STATUS.IN_TRANSIT },
      { $set: { status: ORDER_STATUS.VENDOR_CONFIRMED_DELIVERY } },
    );
  }
  if (targetStatus === LOGISTICS_STATUS.FARMER_DELIVERY_PENDING) {
    await OrderModel.findOneAndUpdate(
      { _id: doc.orderId, status: ORDER_STATUS.VENDOR_CONFIRMED_DELIVERY },
      { $set: { status: ORDER_STATUS.FARMER_CONFIRMED_DELIVERY } },
    );
  }
  if (targetStatus === LOGISTICS_STATUS.DELIVERED) {
    await OrderModel.findOneAndUpdate(
      { _id: doc.orderId, status: { $in: [ORDER_STATUS.FARMER_CONFIRMED_DELIVERY, ORDER_STATUS.VENDOR_CONFIRMED_DELIVERY] } },
      { $set: { status: ORDER_STATUS.DELIVERED } },
    );
  }

  // Notify both parties about logistics status change
  const LOGISTICS_NOTIFICATIONS: Partial<Record<LogisticsStatus, { type: typeof import("@/constants/notification-types").NOTIFICATION_TYPE[keyof typeof import("@/constants/notification-types").NOTIFICATION_TYPE]; title: string; message: string }>> = {
    scheduled: { type: "logistics_scheduled", title: "Transport Scheduled", message: "Transport has been scheduled for your order." },
    picked_up: { type: "in_transit", title: "Picked Up", message: "Produce has been picked up and is on its way." },
    in_transit: { type: "in_transit", title: "In Transit", message: "Your shipment is in transit." },
    vendor_delivery_pending: { type: "vendor_delivery_confirmed", title: "Delivery Confirmed by Buyer", message: "The buyer has confirmed delivery of your crop. Please confirm receipt." },
    farmer_delivery_pending: { type: "farmer_delivery_confirmed", title: "Delivery Confirmed", message: "The farmer has confirmed successful delivery." },
    delivered: { type: "delivered", title: "Delivered", message: "Your order has been delivered." },
  };
  const notification = LOGISTICS_NOTIFICATIONS[targetStatus];
  if (notification) {
    for (const recipientId of [String(doc.farmerId), String(doc.vendorId)]) {
      const recipientRole = recipientId === String(doc.farmerId) ? "farmer" : "vendor";
      void createNotification({
        recipientId,
        recipientRole,
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        entityType: "logistics",
        entityId: String(doc.orderId),
      });
    }
  }

  return buildLogisticsView(updated);
}

export async function cancelLogistics(
  actor: LogisticsActor,
  logisticsId: string,
): Promise<LogisticsView> {
  if (actor.role === "vendor") {
    throw new AuthorizationError(
      "Vendors cannot cancel logistics. Only farmers can manage transportation.",
    );
  }

  const doc = await findOwnedLogistics(actor, logisticsId);
  if (!doc) {
    throw new NotFoundError("Logistics record not found.");
  }
  if (doc.status === LOGISTICS_STATUS.DELIVERED) {
    throw new ConflictError("Cannot cancel delivered logistics.");
  }
  if (doc.status === LOGISTICS_STATUS.CANCELLED) {
    throw new ConflictError("Logistics is already cancelled.");
  }

  const updated = await LogisticsModel.findOneAndUpdate(
    { _id: logisticsId, status: { $nin: [LOGISTICS_STATUS.DELIVERED, LOGISTICS_STATUS.CANCELLED] } },
    { $set: { status: LOGISTICS_STATUS.CANCELLED } },
    { new: true },
  ).lean();
  if (!updated) {
    throw new NotFoundError("Logistics could not be cancelled.");
  }
  return buildLogisticsView(updated);
}
