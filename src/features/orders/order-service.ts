import "server-only";
import { connectToDatabase } from "@/lib/db";
import type { Types } from "mongoose";
import {
  BuyerRequirementModel,
  FarmerProfileModel,
  OfferModel,
  OrderModel,
  ProduceListingModel,
  UserModel,
  VendorProfileModel,
} from "@/models";
import type { Order } from "@/models/order";
import {
  ORDER_STATUS,
  type OrderStatus,
} from "@/constants/order-statuses";
import type { MeasurementUnit } from "@/constants/measurement-units";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import { z } from "zod";
import type { QualityGrade } from "@/constants/quality-grades";
import type { Currency } from "@/constants/currencies";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface OrderActor {
  role: "farmer" | "vendor";
  profileId: string;
  /** The User model _id — compared against offer.orderInitiatorId. */
  userId?: string;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  quantity: number;
  unit: MeasurementUnit;
  agreedPricePerUnit: number;
  totalValue: number;
  currency: string;
  cropName: string;
  quality?: string;
  farmer: {
    profileId: string;
    name?: string;
  };
  vendor: {
    profileId: string;
    businessName?: string;
  };
  pickupLocation?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  deliveryLocation?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Schemas                                                                     */
/* -------------------------------------------------------------------------- */

export const updateOrderLocationSchema = z.object({
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
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(400).optional(),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

let orderCounter = 0;

async function generateOrderNumber(): Promise<string> {
  await connectToDatabase();
  const count = await OrderModel.countDocuments();
  orderCounter = count;
  const seq = String(orderCounter + 1).padStart(5, "0");
  return `KV-${seq}`;
}

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

async function buildOrderView(doc: Order & { _id: Types.ObjectId }): Promise<OrderView> {
  const [farmerName, businessName] = await Promise.all([
    farmerNameOf(String(doc.seller)),
    vendorNameOf(String(doc.buyer)),
  ]);
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber ?? `KV-${String(doc._id).slice(-5).toUpperCase()}`,
    status: doc.status,
    quantity: doc.quantity,
    unit: doc.unit,
    agreedPricePerUnit: doc.agreedPricePerUnit,
    totalValue: doc.totalValue,
    currency: doc.currency,
    cropName: doc.cropName ?? "Unknown",
    quality: doc.quality,
    farmer: {
      profileId: String(doc.seller),
      name: farmerName,
    },
    vendor: {
      profileId: String(doc.buyer),
      businessName,
    },
    pickupLocation: doc.pickupLocation,
    deliveryLocation: doc.deliveryLocation,
    cancellationReason: doc.cancellationReason,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Create Order from Offer                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Creates an Order record from an accepted offer. Called by the offer
 * acceptance flow (Sprint 7 boundary).
 *
 * The Order inherits all commercial terms from the offer and the
 * produce/requirement metadata (crop, quality, locations).
 */
export async function createOrderFromOffer(
  offer: { _id: Types.ObjectId; produceListing: Types.ObjectId; requirement: Types.ObjectId; farmer: Types.ObjectId; vendor: Types.ObjectId; quantity: number; unit: MeasurementUnit; pricePerUnit: number; totalAmount: number; currency?: string },
): Promise<void> {
  const produce = await ProduceListingModel.findById(offer.produceListing)
    .select({ crop: 1, quality: 1, location: 1 })
    .lean() as { crop: string; quality: QualityGrade; location?: { label?: string; geo?: GeoPoint; address?: PostalAddress } } | null;
  const requirement = await BuyerRequirementModel.findById(offer.requirement)
    .select({ location: 1 })
    .lean() as { location?: { label?: string; geo?: GeoPoint; address?: PostalAddress } } | null;

  const orderNumber = await generateOrderNumber();

  await OrderModel.create({
    orderNumber,
    produceListing: offer.produceListing,
    offer: offer._id,
    seller: offer.farmer,
    buyer: offer.vendor,
    quantity: offer.quantity,
    unit: offer.unit,
    agreedPricePerUnit: offer.pricePerUnit,
    currency: (offer.currency ?? "INR") as Currency,
    totalValue: offer.totalAmount,
    status: ORDER_STATUS.CONFIRMED,
    pickupLocation: produce?.location,
    deliveryLocation: requirement?.location,
    cropName: produce?.crop ?? "Unknown",
    quality: produce?.quality,
  });
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

async function findOwnedOrder(
  actor: OrderActor,
  orderId: string,
): Promise<(Order & { _id: Types.ObjectId }) | null> {
  await connectToDatabase();
  const filter =
    actor.role === "farmer"
      ? { _id: orderId, seller: actor.profileId }
      : { _id: orderId, buyer: actor.profileId };
  const doc = await OrderModel.findOne(filter).lean();
  return doc ? (doc as unknown as Order & { _id: Types.ObjectId }) : null;
}

export async function getOrderForFarmer(
  farmerProfileId: string,
  orderId: string,
): Promise<OrderView | null> {
  const doc = await findOwnedOrder(
    { role: "farmer", profileId: farmerProfileId },
    orderId,
  );
  return doc ? buildOrderView(doc) : null;
}

export async function getOrderForVendor(
  vendorProfileId: string,
  orderId: string,
): Promise<OrderView | null> {
  const doc = await findOwnedOrder(
    { role: "vendor", profileId: vendorProfileId },
    orderId,
  );
  return doc ? buildOrderView(doc) : null;
}

export async function listFarmerOrders(
  farmerProfileId: string,
  opts?: { status?: OrderStatus; page?: number; limit?: number },
): Promise<{ orders: OrderView[]; total: number; page: number; limit: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;
  await connectToDatabase();
  const filter: Record<string, unknown> = { seller: farmerProfileId };
  if (opts?.status) {
    filter.status = opts.status;
  }
  const total = await OrderModel.countDocuments(filter);
  const docs = await OrderModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const orders = await Promise.all(docs.map(buildOrderView));
  return { orders, total, page, limit };
}

export async function listVendorOrders(
  vendorProfileId: string,
  opts?: { status?: OrderStatus; page?: number; limit?: number },
): Promise<{ orders: OrderView[]; total: number; page: number; limit: number }> {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 10;
  await connectToDatabase();
  const filter: Record<string, unknown> = { buyer: vendorProfileId };
  if (opts?.status) {
    filter.status = opts.status;
  }
  const total = await OrderModel.countDocuments(filter);
  const docs = await OrderModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  const orders = await Promise.all(docs.map(buildOrderView));
  return { orders, total, page, limit };
}

/* -------------------------------------------------------------------------- */
/* Updates                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateOrderLocation(
  actor: OrderActor,
  orderId: string,
  input: unknown,
): Promise<OrderView> {
  const validated = parseOrThrow(updateOrderLocationSchema, input);
  const doc = await findOwnedOrder(actor, orderId);
  if (!doc) {
    throw new NotFoundError("Order not found.");
  }
  if (doc.status === ORDER_STATUS.CANCELLED) {
    throw new ConflictError("Cannot update a cancelled order.");
  }

  const update: Record<string, unknown> = {};
  if (validated.pickup) {
    update.pickupLocation = validated.pickup;
  }
  if (validated.delivery) {
    update.deliveryLocation = validated.delivery;
  }

  if (Object.keys(update).length === 0) {
    throw new ConflictError("No location data provided.");
  }

  const updated = await OrderModel.findOneAndUpdate(
    { _id: orderId, status: { $ne: ORDER_STATUS.CANCELLED } },
    { $set: update },
    { new: true },
  ).lean();
  if (!updated) {
    throw new NotFoundError("Order not found or has been cancelled.");
  }
  return buildOrderView(updated);
}

export async function cancelOrder(
  actor: OrderActor,
  orderId: string,
  input?: unknown,
): Promise<OrderView> {
  const validated = input ? parseOrThrow(cancelOrderSchema, input) : {};
  const doc = await findOwnedOrder(actor, orderId);
  if (!doc) {
    throw new NotFoundError("Order not found.");
  }
  if (doc.status === ORDER_STATUS.CANCELLED) {
    throw new ConflictError("Order is already cancelled.");
  }
  if (doc.status === ORDER_STATUS.DELIVERED || doc.status === ORDER_STATUS.COMPLETED) {
    throw new ConflictError("Cannot cancel a delivered or completed order.");
  }

  const updated = await OrderModel.findOneAndUpdate(
    { _id: orderId, status: { $ne: ORDER_STATUS.CANCELLED } },
    {
      $set: {
        status: ORDER_STATUS.CANCELLED,
        cancellationReason: validated.reason ?? "Cancelled by user",
      },
    },
    { new: true },
  ).lean();
  if (!updated) {
    throw new NotFoundError("Order could not be cancelled — it may have changed.");
  }
  return buildOrderView(updated);
}

/* -------------------------------------------------------------------------- */
/* Create Order from accepted negotiation (initiator-only)                     */
/* -------------------------------------------------------------------------- */

/**
 * Creates an Order from an accepted negotiation. Only the order initiator
 * (the user who accepted the final offer) is authorized to call this.
 *
 * @throws ConflictError if the order already exists or the user is not the initiator.
 * @throws NotFoundError if the offer is not found or not accepted.
 */
export async function createOrderFromNegotiation(
  actor: OrderActor,
  offerId: string,
): Promise<OrderView> {
  await connectToDatabase();
  const offer = await OfferModel.findById(offerId).lean();
  if (!offer) {
    throw new NotFoundError("Negotiation not found.");
  }

  // Must be accepted
  if (offer.status !== "accepted") {
    throw new ConflictError("This negotiation has not been accepted yet.");
  }

  // Must have an order initiator recorded
  if (!offer.orderInitiatorId) {
    throw new ConflictError("Order initiation information is unavailable for this negotiation.");
  }

  // Only the order initiator can create the order (compare User IDs)
  const initiatorId = String(offer.orderInitiatorId);
  if (!actor.userId || actor.userId !== initiatorId) {
    throw new ConflictError("Only the user who accepted the offer can create the order.");
  }

  // Check for duplicate order
  const existingOrder = await OrderModel.findOne({ offer: offer._id }).lean();
  if (existingOrder) {
    return buildOrderView(existingOrder as Order & { _id: Types.ObjectId });
  }

  // Create order from the accepted offer's commercial terms
  const produce = await ProduceListingModel.findById(offer.produceListing)
    .select({ crop: 1, quality: 1, location: 1 })
    .lean() as { crop: string; quality: QualityGrade; location?: { label?: string; geo?: GeoPoint; address?: PostalAddress } } | null;
  const requirement = await BuyerRequirementModel.findById(offer.requirement)
    .select({ location: 1 })
    .lean() as { location?: { label?: string; geo?: GeoPoint; address?: PostalAddress } } | null;

  const orderNumber = await generateOrderNumber();

  const order = await OrderModel.create({
    orderNumber,
    produceListing: offer.produceListing,
    offer: offer._id,
    seller: offer.farmer,
    buyer: offer.vendor,
    quantity: offer.quantity,
    unit: offer.unit,
    agreedPricePerUnit: offer.pricePerUnit,
    currency: (offer.currency ?? "INR") as Currency,
    totalValue: offer.totalAmount,
    status: ORDER_STATUS.CONFIRMED,
    pickupLocation: produce?.location,
    deliveryLocation: requirement?.location,
    cropName: produce?.crop ?? "Unknown",
    quality: produce?.quality,
  });

  return buildOrderView(order);
}
