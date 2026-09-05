import "server-only";
import { connectToDatabase } from "@/lib/db";
import { BuyerRequirementModel } from "@/models";
import { BUYER_REQUIREMENT_STATUS } from "@/constants/buyer-requirement-statuses";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import { ConflictError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import {
  buyerRequirementSchema,
  type BuyerRequirementInput,
  type BuyerRequirementUpdateInput,
} from "./schemas";
import {
  toBuyerRequirementView,
  type BuyerRequirementView,
} from "./types";

const { ACTIVE, PAUSED, FULFILLED, EXPIRED, CANCELLED } = BUYER_REQUIREMENT_STATUS;

const EDITABLE_STATUSES: BuyerRequirementStatus[] = [ACTIVE, PAUSED];

const ACTIVELY_PAUSABLE: BuyerRequirementStatus[] = [ACTIVE];
const RESUMABLE: BuyerRequirementStatus[] = [PAUSED];
const FULFILLABLE: BuyerRequirementStatus[] = [ACTIVE];
const CANCELLABLE: BuyerRequirementStatus[] = [ACTIVE, PAUSED];

export type RequirementAction = "pause" | "resume" | "fulfill" | "cancel";

const ACTION_LABEL: Record<RequirementAction, string> = {
  pause: "paused",
  resume: "resumed",
  fulfill: "marked as fulfilled",
  cancel: "cancelled",
};

/**
 * Deterministic lifecycle transitions. Requirement status is controlled: only
 * the transitions below are allowed, and every one is enforced server-side.
 */
export function nextStatusForAction(
  action: RequirementAction,
  current: BuyerRequirementStatus,
): { ok: true; status: BuyerRequirementStatus } | { ok: false; message: string } {
  let allowed: BuyerRequirementStatus[];
  switch (action) {
    case "pause":
      allowed = ACTIVELY_PAUSABLE;
      break;
    case "resume":
      allowed = RESUMABLE;
      break;
    case "fulfill":
      allowed = FULFILLABLE;
      break;
    case "cancel":
      allowed = CANCELLABLE;
      break;
  }

  if (!allowed.includes(current)) {
    const currentLabel = current;
    return {
      ok: false,
      message: `This requirement is ${currentLabel} and cannot be ${ACTION_LABEL[action]} right now.`,
    };
  }

  const next: BuyerRequirementStatus =
    action === "pause"
      ? PAUSED
      : action === "resume"
        ? ACTIVE
        : action === "fulfill"
          ? FULFILLED
          : CANCELLED;

  return { ok: true, status: next };
}

export function canEditRequirement(
  status: BuyerRequirementStatus,
): { ok: true } | { ok: false; message: string } {
  if (!EDITABLE_STATUSES.includes(status)) {
    return {
      ok: false,
      message: "A fulfilled, expired or cancelled requirement cannot be edited.",
    };
  }
  return { ok: true };
}

type RequirementLocation = NonNullable<BuyerRequirementInput["location"]>;

function toDbLocation(location: RequirementLocation) {
  const geo: { type: "Point"; coordinates: [number, number] } | undefined =
    location.geo
      ? { type: "Point", coordinates: location.geo.coordinates }
      : undefined;

  return {
    label: location.label,
    address: {
      village: location.address.village,
      district: location.address.district,
      state: location.address.state,
      pincode: location.address.pincode,
    },
    ...(geo ? { geo } : {}),
  };
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function expireOverdueRequirements(vendorProfileId?: string): Promise<void> {
  const filter: Record<string, unknown> = {
    status: ACTIVE,
    requiredBy: { $lt: startOfTodayUtc() },
  };
  if (vendorProfileId) {
    filter.vendor = vendorProfileId;
  }
  await BuyerRequirementModel.updateMany(filter, {
    $set: { status: EXPIRED },
  });
}

export async function createBuyerRequirement(
  vendorProfileId: string,
  input: BuyerRequirementInput,
): Promise<BuyerRequirementView> {
  const data = input;

  await connectToDatabase();
  const doc = await BuyerRequirementModel.create({
    vendor: vendorProfileId,
    crop: data.crop,
    variety: data.variety,
    quality: data.quality,
    quantity: data.quantity,
    unit: data.unit,
    targetPriceMin: data.targetPriceMin,
    targetPriceMax: data.targetPriceMax,
    requiredBy: new Date(`${data.requiredBy}T00:00:00Z`),
    notes: data.notes,
    location: toDbLocation(data.location),
    status: ACTIVE,
  });

  return toBuyerRequirementView(doc);
}

export interface VendorRequirementList {
  requirements: BuyerRequirementView[];
  counts: Record<BuyerRequirementStatus, number>;
}

export async function listVendorRequirements(
  vendorProfileId: string,
): Promise<VendorRequirementList> {
  await connectToDatabase();
  await expireOverdueRequirements(vendorProfileId);

  const docs = await BuyerRequirementModel.find({ vendor: vendorProfileId })
    .sort({ createdAt: -1 })
    .lean();

  const requirements = docs.map((doc) => toBuyerRequirementView(doc));
  const counts: Record<BuyerRequirementStatus, number> = {
    active: 0,
    paused: 0,
    fulfilled: 0,
    expired: 0,
    cancelled: 0,
  };
  for (const requirement of requirements) {
    counts[requirement.status] += 1;
  }

  return { requirements, counts };
}

export async function getOwnedBuyerRequirement(
  vendorProfileId: string,
  requirementId: string,
): Promise<BuyerRequirementView | null> {
  await connectToDatabase();
  const doc = await BuyerRequirementModel.findOne({
    _id: requirementId,
    vendor: vendorProfileId,
  }).lean();
  if (!doc) {
    return null;
  }

  // Surface honest state: an active requirement whose date has passed is expired.
  if (doc.status === ACTIVE && doc.requiredBy.getTime() < startOfTodayUtc().getTime()) {
    await BuyerRequirementModel.updateOne(
      { _id: requirementId, vendor: vendorProfileId },
      { $set: { status: EXPIRED } },
    );
    const refreshed = await BuyerRequirementModel.findOne({
      _id: requirementId,
      vendor: vendorProfileId,
    }).lean();
    return refreshed ? toBuyerRequirementView(refreshed) : null;
  }

  return toBuyerRequirementView(doc);
}

export async function updateBuyerRequirementFields(
  vendorProfileId: string,
  requirementId: string,
  patch: BuyerRequirementUpdateInput,
): Promise<BuyerRequirementView | null> {
  await connectToDatabase();

  const current = await BuyerRequirementModel.findOne({
    _id: requirementId,
    vendor: vendorProfileId,
  }).lean();
  if (!current) {
    return null;
  }

  const editCheck = canEditRequirement(current.status);
  if (!editCheck.ok) {
    throw new ConflictError(editCheck.message);
  }

  const currentLocation = current.location ?? {};
  const currentAddress = currentLocation.address ?? {};
  const currentGeo = currentLocation.geo;

  let nextGeo:
    | { type: "Point"; coordinates: [number, number] }
    | undefined;

  if (patch.location?.geo) {
    nextGeo = patch.location.geo;
  } else if (
    currentGeo?.type === "Point" &&
    Array.isArray(currentGeo.coordinates) &&
    currentGeo.coordinates.length === 2
  ) {
    nextGeo = {
      type: "Point",
      coordinates: [
        Number(currentGeo.coordinates[0]),
        Number(currentGeo.coordinates[1]),
      ],
    };
  }

  const next = {
    crop: patch.crop ?? current.crop,
    variety: patch.variety !== undefined ? patch.variety : current.variety,
    quality: patch.quality ?? current.quality,
    quantity: patch.quantity ?? current.quantity,
    unit: patch.unit ?? current.unit,
    targetPriceMin: patch.targetPriceMin ?? current.targetPriceMin,
    targetPriceMax: patch.targetPriceMax ?? current.targetPriceMax,
    requiredBy: patch.requiredBy ?? toDateOnlyString(current.requiredBy),
    notes: patch.notes !== undefined ? patch.notes : current.notes,
    location: {
      label:
        patch.location?.label !== undefined
          ? patch.location.label
          : currentLocation.label,
      address: {
        village:
          patch.location?.address?.village !== undefined
            ? patch.location.address.village
            : currentAddress.village,
        district: patch.location?.address?.district ?? currentAddress.district ?? "",
        state: patch.location?.address?.state ?? currentAddress.state ?? "",
        pincode:
          patch.location?.address?.pincode !== undefined
            ? patch.location.address.pincode
            : currentAddress.pincode,
      },
      geo: nextGeo,
    },
  };

  const validated = parseOrThrow(buyerRequirementSchema, next);

  const update: Record<string, unknown> = {
    crop: validated.crop,
    variety: validated.variety,
    quality: validated.quality,
    quantity: validated.quantity,
    unit: validated.unit,
    targetPriceMin: validated.targetPriceMin,
    targetPriceMax: validated.targetPriceMax,
    requiredBy: new Date(`${validated.requiredBy}T00:00:00Z`),
    notes: validated.notes,
    location: toDbLocation(validated.location),
  };

  await BuyerRequirementModel.updateOne(
    { _id: requirementId, vendor: vendorProfileId },
    { $set: update },
    { runValidators: true },
  );

  return getOwnedBuyerRequirement(vendorProfileId, requirementId);
}

export async function transitionBuyerRequirement(
  vendorProfileId: string,
  requirementId: string,
  action: RequirementAction,
): Promise<BuyerRequirementView | null> {
  await connectToDatabase();

  const current = await BuyerRequirementModel.findOne({
    _id: requirementId,
    vendor: vendorProfileId,
  }).lean();
  if (!current) {
    return null;
  }

  const transition = nextStatusForAction(action, current.status);
  if (!transition.ok) {
    throw new ConflictError(transition.message);
  }

  await BuyerRequirementModel.updateOne(
    { _id: requirementId, vendor: vendorProfileId },
    { $set: { status: transition.status } },
    { runValidators: true },
  );

  return getOwnedBuyerRequirement(vendorProfileId, requirementId);
}

function toDateOnlyString(value: Date): string | undefined {
  if (!value) {
    return undefined;
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
