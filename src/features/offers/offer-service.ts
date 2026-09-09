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
import {
  ACTIVE_OFFER_STATUSES,
  OFFER_STATUS,
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/constants/offer-statuses";
import { BUYER_REQUIREMENT_STATUS } from "@/constants/buyer-requirement-statuses";
import { PRODUCE_LISTING_STATUS } from "@/constants/produce-listing-statuses";
import { getCropById } from "@/constants/crops";
import type { MeasurementUnit } from "@/constants/measurement-units";
import { QUINTAL_CONVERSION } from "@/features/matching/config";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { createOrderFromOffer } from "@/features/orders/order-service";
import { parseOrThrow } from "@/lib/validation";
import type { OfferHistoryAction, OfferParty } from "@/models/offer";
import {
  counterOfferSchema,
  createOfferSchema,
  offerListQuerySchema,
  type OfferPaginationMeta,
} from "./schemas";
import { partyToRespond, toOfferView, type OfferView, type OfferViewContext } from "./types";

const { ACTIVE: ACTIVE_REQUIREMENT, FULFILLED: FULFILLED_REQUIREMENT } =
  BUYER_REQUIREMENT_STATUS;
const { ACTIVE: ACTIVE_LISTING } = PRODUCE_LISTING_STATUS;
const { PENDING, COUNTERED, ACCEPTED, REJECTED, WITHDRAWN } = OFFER_STATUS;

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  kg: "Kg",
  quintal: "Quintal",
  tonne: "Tonne",
};

export interface OfferActor {
  role: "farmer" | "vendor";
  profileId: string;
}

export type OfferAction = "accept" | "reject" | "counter" | "withdraw";

/* ------------------------------------------------------------------------- */
/* Pure, deterministic rules (unit-tested, no database)                       */
/* ------------------------------------------------------------------------- */

/** Authoritative total: quantity × pricePerUnit, rounded to 2 decimals. */
export function computeTotalAmount(
  quantity: number,
  pricePerUnit: number,
): number {
  return Math.round(quantity * pricePerUnit * 100) / 100;
}

export function toQuintalQuantity(quantity: number, unit: string): number {
  return quantity * (QUINTAL_CONVERSION[unit] ?? 1);
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Centralised offer state machine. Statuses are controlled server-side; the
 * frontend only ever asks for an action and the service decides the outcome.
 *
 *   PENDING (farmer's proposal awaits buyer)
 *     → buyer accepts / rejects / counters → ACCEPTED | REJECTED | COUNTERED
 *   COUNTERED (buyer's counter awaits farmer)
 *     → farmer accepts / rejects / counters → ACCEPTED | REJECTED | PENDING
 *   PENDING → farmer withdraws own proposal → WITHDRAWN
 *   COUNTERED → buyer withdraws own counter → WITHDRAWN
 *   ACCEPTED / REJECTED / WITHDRAWN are terminal.
 */
export function canActOnOffer(
  action: OfferAction,
  status: OfferStatus,
  actor: OfferParty,
): { ok: true } | { ok: false; message: string } {
  const terminal =
    status === ACCEPTED || status === REJECTED || status === WITHDRAWN;

  if (terminal) {
    return {
      ok: false,
      message: `This negotiation is already ${OFFER_STATUS_LABELS[status].toLowerCase()} and cannot be changed.`,
    };
  }

  const respondent = partyToRespond(status);
  const proposer: OfferParty | null =
    respondent === "farmer" ? "vendor" : respondent === "vendor" ? "farmer" : null;

  if (action === "withdraw") {
    if (actor !== proposer) {
      return {
        ok: false,
        message: "Only the party who made the latest proposal can withdraw it.",
      };
    }
    return { ok: true };
  }

  if (actor !== respondent) {
    const awaiting =
      respondent === "vendor" ? "the buyer's response" : "the farmer's response";
    return {
      ok: false,
      message: `This negotiation is waiting for ${awaiting}.`,
    };
  }
  return { ok: true };
}

/** Quantity still needed by a requirement, expressed in `targetUnit`. */
export function remainingQuantityInUnit(
  requirement: {
    quantity: number;
    unit: MeasurementUnit;
    allocatedQuantity?: number;
  },
  targetUnit: MeasurementUnit,
): number {
  const remaining = Math.max(
    0,
    requirement.quantity - (requirement.allocatedQuantity ?? 0),
  );
  const quintals = remaining * (QUINTAL_CONVERSION[requirement.unit] ?? 1);
  return quintals / (QUINTAL_CONVERSION[targetUnit] ?? 1);
}

/** Quantity not yet locked by an accepted agreement, in listing units. */
export function availableQuantityOf(produce: {
  quantity: number;
  committedQuantity?: number;
}): number {
  return Math.max(0, produce.quantity - (produce.committedQuantity ?? 0));
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function cropLabel(cropId: string): string {
  return getCropById(cropId)?.name ?? cropId;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(roundTo(value, 2));
}

/* ------------------------------------------------------------------------- */
/* Lean document shapes                                                       */
/* ------------------------------------------------------------------------- */

interface LeanOfferDoc {
  _id: Types.ObjectId;
  produceListing: Types.ObjectId;
  requirement: Types.ObjectId;
  farmer: Types.ObjectId;
  vendor: Types.ObjectId;
  quantity: number;
  unit: MeasurementUnit;
  pricePerUnit: number;
  currency?: string;
  totalAmount: number;
  status: OfferStatus;
  history?: Array<{
    party: OfferParty;
    action: OfferHistoryAction;
    quantity: number;
    unit: MeasurementUnit;
    pricePerUnit: number;
    totalAmount: number;
    note?: string;
    at: Date;
  }>;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface LeanLocation {
  label?: string;
  geo?: { type?: string; coordinates?: number[] } | null;
  address?: {
    village?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
}

interface LeanProduceDoc {
  _id: Types.ObjectId;
  crop: string;
  variety?: string;
  quality?: string;
  quantity: number;
  committedQuantity?: number;
  unit: MeasurementUnit;
  pricePerUnit?: number | null;
  expectedHarvestDate?: Date | null;
  location?: LeanLocation;
  status: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface LeanRequirementDoc {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  crop: string;
  quality?: string;
  quantity: number;
  unit: MeasurementUnit;
  allocatedQuantity?: number;
  targetPriceMin: number;
  targetPriceMax: number;
  requiredBy: Date | string;
  status: string;
  location?: LeanLocation;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/* ------------------------------------------------------------------------- */
/* Domain validation shared by create + counter                               */
/* ------------------------------------------------------------------------- */

/**
 * Validates a proposed quantity against real domain state. Returns an error
 * message, or null when the proposal is admissible. The offer unit is always
 * the produce listing's unit.
 */
function checkProposal({
  produce,
  requirement,
  quantity,
}: {
  produce: LeanProduceDoc;
  requirement: LeanRequirementDoc;
  quantity: number;
}): string | null {
  if (produce.status !== ACTIVE_LISTING) {
    return "Only published produce can be offered. Publish the crop first.";
  }
  if (requirement.status !== ACTIVE_REQUIREMENT) {
    return "This buying requirement is no longer active, so offers cannot be made against it.";
  }
  const requiredBy =
    typeof requirement.requiredBy === "string"
      ? new Date(requirement.requiredBy)
      : requirement.requiredBy;
  if (requiredBy.getTime() < startOfTodayUtc().getTime()) {
    return "This requirement's required-by date has passed, so it is no longer open to offers.";
  }
  if (produce.crop !== requirement.crop) {
    return `The requirement is for ${cropLabel(requirement.crop)}, not ${cropLabel(produce.crop)}.`;
  }
  const available = availableQuantityOf(produce);
  const unitLabel = UNIT_LABELS[produce.unit] ?? produce.unit;
  if (quantity > available) {
    const committed = produce.committedQuantity ?? 0;
    if (committed > 0) {
      return `Already committed ${formatQuantity(committed)} ${unitLabel} of your listing to other agreements, so ${formatQuantity(available)} ${unitLabel} remain available. You offered ${formatQuantity(quantity)} ${unitLabel}.`;
    }
    return `Your listing has ${formatQuantity(produce.quantity)} ${unitLabel} available; you offered ${formatQuantity(quantity)} ${unitLabel}.`;
  }
  const remaining = roundTo(
    remainingQuantityInUnit(requirement, produce.unit),
    6,
  );
  if (quantity > remaining) {
    return `The buyer still needs ${formatQuantity(remaining)} ${UNIT_LABELS[produce.unit] ?? produce.unit} of this crop; your offer of ${formatQuantity(quantity)} exceeds it.`;
  }
  return null;
}

function historyEvent(
  party: OfferParty,
  action: OfferHistoryAction,
  quantity: number,
  unit: MeasurementUnit,
  pricePerUnit: number,
  note?: string,
) {
  return {
    party,
    action,
    quantity,
    unit,
    pricePerUnit,
    totalAmount: computeTotalAmount(quantity, pricePerUnit),
    note,
    at: new Date(),
  };
}

/* ------------------------------------------------------------------------- */
/* Joins                                                                      */
/* ------------------------------------------------------------------------- */

async function farmerNameOf(farmerProfileId: unknown): Promise<string | undefined> {
  const profile = await FarmerProfileModel.findById(farmerProfileId)
    .select({ user: 1 })
    .lean();
  if (!profile?.user) {
    return undefined;
  }
  const user = await UserModel.findById(profile.user)
    .select({ fullName: 1 })
    .lean();
  return user?.fullName || undefined;
}

async function vendorBusinessNameOf(
  vendorProfileId: unknown,
): Promise<string | undefined> {
  const profile = await VendorProfileModel.findById(vendorProfileId)
    .select({ businessName: 1 })
    .lean();
  return profile?.businessName || undefined;
}

async function farmerNamesByProfileIds(
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) {
    return map;
  }
  const profiles = (await FarmerProfileModel.find({ _id: { $in: ids } })
    .select({ user: 1 })
    .lean()) as unknown as Array<{ _id: unknown; user?: unknown }>;

  const userIds = profiles
    .map((profile) => (profile.user ? String(profile.user) : undefined))
    .filter((id): id is string => Boolean(id));

  const namesByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const users = (await UserModel.find({ _id: { $in: userIds } })
      .select({ fullName: 1 })
      .lean()) as unknown as Array<{ _id: unknown; fullName?: string }>;
    for (const user of users) {
      if (user.fullName) {
        namesByUserId.set(String(user._id), user.fullName);
      }
    }
  }

  for (const profile of profiles) {
    const userId = profile.user ? String(profile.user) : undefined;
    const name = userId ? namesByUserId.get(userId) : undefined;
    if (name) {
      map.set(String(profile._id), name);
    }
  }
  return map;
}

async function vendorNamesByIds(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) {
    return map;
  }
  const profiles = (await VendorProfileModel.find({ _id: { $in: ids } })
    .select({ businessName: 1 })
    .lean()) as unknown as Array<{ _id: unknown; businessName?: string }>;
  for (const profile of profiles) {
    if (profile.businessName) {
      map.set(String(profile._id), profile.businessName);
    }
  }
  return map;
}

async function buildContext(
  doc: LeanOfferDoc,
): Promise<OfferViewContext> {
  const produce = await ProduceListingModel.findById(doc.produceListing).lean();
  const requirement = await BuyerRequirementModel.findById(doc.requirement).lean();
  if (!produce || !requirement) {
    throw new NotFoundError(
      "The produce or requirement for this negotiation no longer exists.",
    );
  }
  const [farmerName, businessName] = await Promise.all([
    farmerNameOf(doc.farmer),
    vendorBusinessNameOf(doc.vendor),
  ]);
  return {
    produce: produce as unknown as OfferViewContext["produce"],
    requirement: requirement as unknown as OfferViewContext["requirement"],
    farmerName,
    businessName,
  };
}

async function buildViewsForDocs(docs: LeanOfferDoc[]): Promise<OfferView[]> {
  if (docs.length === 0) {
    return [];
  }
  const produceIds = Array.from(
    new Set(docs.map((doc) => String(doc.produceListing))),
  );
  const requirementIds = Array.from(
    new Set(docs.map((doc) => String(doc.requirement))),
  );
  const farmerIds = Array.from(new Set(docs.map((doc) => String(doc.farmer))));
  const vendorIds = Array.from(new Set(docs.map((doc) => String(doc.vendor))));

  const [produceDocs, requirementDocs, farmerNames, vendorNames] =
    await Promise.all([
      ProduceListingModel.find({ _id: { $in: produceIds } }).lean(),
      BuyerRequirementModel.find({ _id: { $in: requirementIds } }).lean(),
      farmerNamesByProfileIds(farmerIds),
      vendorNamesByIds(vendorIds),
    ]);

  const produceMap = new Map(
    produceDocs.map((doc) => [String(doc._id), doc]),
  );
  const requirementMap = new Map(
    requirementDocs.map((doc) => [String(doc._id), doc]),
  );

  return docs.map((doc) => {
    const produce = produceMap.get(String(doc.produceListing));
    const requirement = requirementMap.get(String(doc.requirement));
    if (!produce || !requirement) {
      throw new NotFoundError(
        "The produce or requirement for this negotiation no longer exists.",
      );
    }
    return toOfferView(doc, {
      produce: produce as unknown as OfferViewContext["produce"],
      requirement:
        requirement as unknown as OfferViewContext["requirement"],
      farmerName: farmerNames.get(String(doc.farmer)),
      businessName: vendorNames.get(String(doc.vendor)),
    });
  });
}

/* ------------------------------------------------------------------------- */
/* Reads                                                                      */
/* ------------------------------------------------------------------------- */

async function findOwnedOffer(
  actor: OfferActor,
  offerId: string,
): Promise<LeanOfferDoc | null> {
  await connectToDatabase();
  const filter =
    actor.role === "farmer"
      ? { _id: offerId, farmer: actor.profileId }
      : { _id: offerId, vendor: actor.profileId };
  const doc = await OfferModel.findOne(filter).lean();
  return doc ? (doc as unknown as LeanOfferDoc) : null;
}

export async function getOfferForFarmer(
  farmerProfileId: string,
  offerId: string,
): Promise<OfferView | null> {
  const doc = await findOwnedOffer({ role: "farmer", profileId: farmerProfileId }, offerId);
  if (!doc) {
    return null;
  }
  const view = toOfferView(doc, await buildContext(doc));
  if (doc.status === ACCEPTED) {
    const order = await OrderModel.findOne({ offer: doc._id })
      .select({ _id: 1 })
      .lean();
    if (order) {
      view.orderId = String(order._id);
    }
  }
  return view;
}

export async function getOfferForVendor(
  vendorProfileId: string,
  offerId: string,
): Promise<OfferView | null> {
  const doc = await findOwnedOffer({ role: "vendor", profileId: vendorProfileId }, offerId);
  if (!doc) {
    return null;
  }
  const view = toOfferView(doc, await buildContext(doc));
  if (doc.status === ACCEPTED) {
    const order = await OrderModel.findOne({ offer: doc._id })
      .select({ _id: 1 })
      .lean();
    if (order) {
      view.orderId = String(order._id);
    }
  }
  return view;
}

export interface OfferListResult {
  offers: OfferView[];
  meta: OfferPaginationMeta;
}

export async function listFarmerOffers(
  farmerProfileId: string,
  query: unknown,
): Promise<OfferListResult> {
  const parsed = parseOrThrow(offerListQuerySchema, query);
  await connectToDatabase();
  const filter = { farmer: farmerProfileId };
  const total = await OfferModel.countDocuments(filter);
  const docs = (await OfferModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((parsed.page - 1) * parsed.limit)
    .limit(parsed.limit)
    .lean()) as unknown as LeanOfferDoc[];
  return {
    offers: await buildViewsForDocs(docs),
    meta: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}

export async function listVendorOffers(
  vendorProfileId: string,
  query: unknown,
): Promise<OfferListResult> {
  const parsed = parseOrThrow(offerListQuerySchema, query);
  await connectToDatabase();
  const filter: Record<string, unknown> = { vendor: vendorProfileId };
  if (parsed.requirementId) {
    filter.requirement = parsed.requirementId;
  }
  const total = await OfferModel.countDocuments(filter);
  const docs = (await OfferModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((parsed.page - 1) * parsed.limit)
    .limit(parsed.limit)
    .lean()) as unknown as LeanOfferDoc[];
  return {
    offers: await buildViewsForDocs(docs),
    meta: {
      page: parsed.page,
      limit: parsed.limit,
      total,
      totalPages: Math.ceil(total / parsed.limit),
    },
  };
}

/** Pending (unanswered) offer counts per requirement for a vendor's dashboards. */
export async function countPendingOffersByRequirement(
  vendorProfileId: string,
): Promise<Record<string, number>> {
  await connectToDatabase();
  const docs = await OfferModel.find({
    vendor: vendorProfileId,
    status: OFFER_STATUS.PENDING,
  })
    .select({ requirement: 1 })
    .lean();
  const counts: Record<string, number> = {};
  for (const doc of docs) {
    const key = String(doc.requirement);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/* ------------------------------------------------------------------------- */
/* Farmer creates an offer                                                    */
/* ------------------------------------------------------------------------- */

export async function createOffer(
  farmerProfileId: string,
  input: unknown,
): Promise<OfferView> {
  const validated = parseOrThrow(createOfferSchema, input);
  await connectToDatabase();

  const produce = (await ProduceListingModel.findOne({
    _id: validated.produceId,
    farmer: farmerProfileId,
  }).lean()) as unknown as LeanProduceDoc | null;
  if (!produce) {
    throw new NotFoundError("Listing not found.");
  }

  const requirement = (await BuyerRequirementModel.findById(
    validated.requirementId,
  ).lean()) as unknown as LeanRequirementDoc | null;
  if (!requirement) {
    throw new NotFoundError("Buying requirement not found.");
  }

  const domainCheck = checkProposal({
    produce,
    requirement,
    quantity: validated.quantity,
  });
  if (domainCheck) {
    throw new ConflictError(domainCheck);
  }

  // Duplicate-submission guard. The unique partial index on the model is the
  // hard backstop; this pre-check gives a friendlier message.
  const existing = await OfferModel.exists({
    produceListing: produce._id,
    requirement: requirement._id,
    farmer: farmerProfileId,
    status: { $in: ACTIVE_OFFER_STATUSES },
  });
  if (existing) {
    throw new ConflictError(
      "You already have an active negotiation for this requirement and crop. Respond to it from My Negotiations.",
    );
  }

  const totalAmount = computeTotalAmount(
    validated.quantity,
    validated.pricePerUnit,
  );

  const doc = await OfferModel.create({
    produceListing: produce._id,
    requirement: requirement._id,
    farmer: farmerProfileId,
    vendor: requirement.vendor,
    quantity: validated.quantity,
    unit: produce.unit,
    pricePerUnit: validated.pricePerUnit,
    totalAmount,
    status: PENDING,
    history: [
      historyEvent(
        "farmer",
        "offer",
        validated.quantity,
        produce.unit,
        validated.pricePerUnit,
        validated.note,
      ),
    ],
  });

  const fresh = (await OfferModel.findById(doc._id).lean()) as unknown as LeanOfferDoc;
  return toOfferView(fresh, await buildContext(fresh));
}

/* ------------------------------------------------------------------------- */
/* Responses: counter / accept / reject / withdraw                            */
/* ------------------------------------------------------------------------- */

export async function counterOffer(
  actor: OfferActor,
  offerId: string,
  input: unknown,
): Promise<OfferView | null> {
  const validated = parseOrThrow(counterOfferSchema, input);
  const doc = await findOwnedOffer(actor, offerId);
  if (!doc) {
    return null;
  }

  const can = canActOnOffer("counter", doc.status, actor.role);
  if (!can.ok) {
    throw new ConflictError(can.message);
  }

  const quantity = validated.quantity ?? doc.quantity;
  const pricePerUnit = validated.pricePerUnit ?? doc.pricePerUnit;

  const [produce, requirement] = await Promise.all([
    ProduceListingModel.findById(doc.produceListing).lean() as Promise<LeanProduceDoc | null>,
    BuyerRequirementModel.findById(doc.requirement).lean() as Promise<LeanRequirementDoc | null>,
  ]);
  if (!produce) {
    throw new NotFoundError("The produce listing for this offer no longer exists.");
  }
  if (!requirement) {
    throw new NotFoundError("The buying requirement for this offer no longer exists.");
  }

  const domainCheck = checkProposal({ produce, requirement, quantity });
  if (domainCheck) {
    throw new ConflictError(domainCheck);
  }

  const totalAmount = computeTotalAmount(quantity, pricePerUnit);
  // PENDING = farmer's proposal awaits buyer; COUNTERED = buyer's awaits farmer.
  const nextStatus: OfferStatus =
    actor.role === "farmer" ? PENDING : COUNTERED;

  const updated = (await OfferModel.findOneAndUpdate(
    { _id: offerId, status: doc.status },
    {
      $set: { quantity, pricePerUnit, totalAmount, status: nextStatus },
      $push: {
        history: historyEvent(
          actor.role,
          "counter",
          quantity,
          doc.unit,
          pricePerUnit,
          validated.note,
        ),
      },
    },
    { new: true },
  ).lean()) as unknown as LeanOfferDoc | null;

  if (!updated) {
    throw new ConflictError(
      "This negotiation changed while you were responding. Please refresh and try again.",
    );
  }
  return toOfferView(updated, await buildContext(updated));
}

export async function acceptOffer(
  actor: OfferActor,
  offerId: string,
): Promise<OfferView | null> {
  const doc = await findOwnedOffer(actor, offerId);
  if (!doc) {
    return null;
  }

  const can = canActOnOffer("accept", doc.status, actor.role);
  if (!can.ok) {
    throw new ConflictError(can.message);
  }

  const [produce, requirement] = await Promise.all([
    ProduceListingModel.findById(doc.produceListing).lean() as Promise<LeanProduceDoc | null>,
    BuyerRequirementModel.findById(doc.requirement).lean() as Promise<LeanRequirementDoc | null>,
  ]);
  if (!produce) {
    throw new NotFoundError("The produce listing for this offer no longer exists.");
  }
  if (!requirement) {
    throw new NotFoundError("The buying requirement for this offer no longer exists.");
  }

  const domainCheck = checkProposal({ produce, requirement, quantity: doc.quantity });
  if (domainCheck) {
    throw new ConflictError(domainCheck);
  }

  // Concurrency gates: atomically consume the quantity on BOTH the demand
  // side (requirement) and the supply side (produce listing). Each $expr
  // conditional update is atomic per document, so concurrent acceptances
  // serialise and only those that fit the remaining capacity pass — no
  // negative remaining, no double allocation, no over-committed produce.
  const consumeInRequirementUnit = roundTo(
    toQuintalQuantity(doc.quantity, doc.unit) /
      (QUINTAL_CONVERSION[requirement.unit] ?? 1),
    6,
  );
  const consumeInProduceUnit = doc.quantity; // offer unit is always the listing's

  const reserved = await BuyerRequirementModel.updateOne(
    {
      _id: requirement._id,
      status: ACTIVE_REQUIREMENT,
      $expr: {
        $lte: [
          {
            $add: [
              { $ifNull: ["$allocatedQuantity", 0] },
              consumeInRequirementUnit,
            ],
          },
          "$quantity",
        ],
      },
    },
    { $inc: { allocatedQuantity: consumeInRequirementUnit } },
  );
  if (reserved.matchedCount === 0) {
    throw new ConflictError(
      "Another acceptance just used up the remaining quantity. Please refresh and check the requirement.",
    );
  }

  const reservedProduce = await ProduceListingModel.updateOne(
    {
      _id: produce._id,
      $expr: {
        $lte: [
          {
            $add: [
              { $ifNull: ["$committedQuantity", 0] },
              consumeInProduceUnit,
            ],
          },
          "$quantity",
        ],
      },
    },
    { $inc: { committedQuantity: consumeInProduceUnit } },
  );
  if (reservedProduce.matchedCount === 0) {
    // Another acceptance already committed this listing's supply — revert the
    // requirement reservation so nothing stays half-allocated.
    await BuyerRequirementModel.updateOne(
      { _id: requirement._id, allocatedQuantity: { $gte: consumeInRequirementUnit } },
      { $inc: { allocatedQuantity: -consumeInRequirementUnit } },
    );
    throw new ConflictError(
      "Another agreement just used up the remaining quantity of this produce listing. Please refresh and check availability.",
    );
  }

  const accepted = (await OfferModel.findOneAndUpdate(
    { _id: offerId, status: doc.status },
    {
      $set: { status: ACCEPTED },
      $push: {
        history: historyEvent(
          actor.role,
          "accept",
          doc.quantity,
          doc.unit,
          doc.pricePerUnit,
        ),
      },
    },
    { new: true },
  ).lean()) as unknown as LeanOfferDoc | null;

  if (!accepted) {
    // Narrow race: another action changed the offer between reservation and
    // accept. Revert both reservations so nothing is over-committed.
    await BuyerRequirementModel.updateOne(
      { _id: requirement._id, allocatedQuantity: { $gte: consumeInRequirementUnit } },
      { $inc: { allocatedQuantity: -consumeInRequirementUnit } },
    );
    await ProduceListingModel.updateOne(
      { _id: produce._id, committedQuantity: { $gte: consumeInProduceUnit } },
      { $inc: { committedQuantity: -consumeInProduceUnit } },
    );
    throw new ConflictError(
      "This negotiation changed while accepting. Please refresh and try again.",
    );
  }

  // When the requirement is now fully committed, it becomes fulfilled. Only
  // accepted allocation counts — sending offers never fulfils a requirement.
  const newAllocated =
    (requirement.allocatedQuantity ?? 0) + consumeInRequirementUnit;
  if (newAllocated >= requirement.quantity - 1e-6) {
    await BuyerRequirementModel.updateOne(
      { _id: requirement._id, status: ACTIVE_REQUIREMENT },
      { $set: { status: FULFILLED_REQUIREMENT } },
    );
  }

  // Sprint 7 boundary: create the Order from the accepted offer.
  await createOrderFromOffer({
    _id: accepted._id,
    produceListing: accepted.produceListing,
    requirement: accepted.requirement,
    farmer: accepted.farmer,
    vendor: accepted.vendor,
    quantity: accepted.quantity,
    unit: accepted.unit,
    pricePerUnit: accepted.pricePerUnit,
    totalAmount: accepted.totalAmount,
    currency: accepted.currency,
  });

  return toOfferView(accepted, await buildContext(accepted));
}

export async function rejectOffer(
  actor: OfferActor,
  offerId: string,
): Promise<OfferView | null> {
  const doc = await findOwnedOffer(actor, offerId);
  if (!doc) {
    return null;
  }

  const can = canActOnOffer("reject", doc.status, actor.role);
  if (!can.ok) {
    throw new ConflictError(can.message);
  }

  const updated = (await OfferModel.findOneAndUpdate(
    { _id: offerId, status: doc.status },
    {
      $set: { status: REJECTED },
      $push: {
        history: historyEvent(
          actor.role,
          "reject",
          doc.quantity,
          doc.unit,
          doc.pricePerUnit,
        ),
      },
    },
    { new: true },
  ).lean()) as unknown as LeanOfferDoc | null;

  if (!updated) {
    throw new ConflictError(
      "This negotiation changed while you were responding. Please refresh and try again.",
    );
  }
  return toOfferView(updated, await buildContext(updated));
}

export async function withdrawOffer(
  actor: OfferActor,
  offerId: string,
): Promise<OfferView | null> {
  const doc = await findOwnedOffer(actor, offerId);
  if (!doc) {
    return null;
  }

  const can = canActOnOffer("withdraw", doc.status, actor.role);
  if (!can.ok) {
    throw new ConflictError(can.message);
  }

  const updated = (await OfferModel.findOneAndUpdate(
    { _id: offerId, status: doc.status },
    {
      $set: { status: WITHDRAWN },
      $push: {
        history: historyEvent(
          actor.role,
          "withdraw",
          doc.quantity,
          doc.unit,
          doc.pricePerUnit,
        ),
      },
    },
    { new: true },
  ).lean()) as unknown as LeanOfferDoc | null;

  if (!updated) {
    throw new ConflictError(
      "This negotiation changed while you were responding. Please refresh and try again.",
    );
  }
  return toOfferView(updated, await buildContext(updated));
}