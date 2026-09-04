import "server-only";
import { connectToDatabase } from "@/lib/db";
import { ProduceListingModel } from "@/models";
import { getCropById } from "@/constants/crops";
import { PRODUCE_LISTING_STATUS } from "@/constants/produce-listing-statuses";
import { parseOrThrow } from "@/lib/validation";
import { NotFoundError } from "@/lib/errors";
import {
  produceListingSchema,
  type ProduceListingInput,
  type ProduceListingUpdateInput,
} from "./schemas";
import { toProduceListingView, type ProduceListingView } from "./types";

type ListingLocation = NonNullable<
  ProduceListingInput["location"]
>;

function toDbLocation(location: ListingLocation) {
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

export async function createProduceListing(
  farmerProfileId: string,
  input: ProduceListingInput,
): Promise<ProduceListingView> {
  await connectToDatabase();

  const doc = await ProduceListingModel.create({
    farmer: farmerProfileId,
    crop: input.crop,
    variety: input.variety,
    quantity: input.quantity,
    unit: input.unit,
    quality: input.quality,
    expectedHarvestDate: new Date(`${input.expectedHarvestDate}T00:00:00Z`),
    location: toDbLocation(input.location),
    status: PRODUCE_LISTING_STATUS.ACTIVE,
  });

  return toProduceListingView(doc);
}

export async function getFarmerProduceListings(
  farmerProfileId: string,
): Promise<ProduceListingView[]> {
  await connectToDatabase();
  const docs = await ProduceListingModel.find({ farmer: farmerProfileId })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => toProduceListingView(doc));
}

export async function getFarmerProduceListing(
  listingId: string,
  farmerProfileId: string,
): Promise<ProduceListingView | null> {
  await connectToDatabase();
  const doc = await ProduceListingModel.findOne({
    _id: listingId,
    farmer: farmerProfileId,
  }).lean();
  return doc ? toProduceListingView(doc) : null;
}

export async function updateProduceListing(
  listingId: string,
  farmerProfileId: string,
  patch: ProduceListingUpdateInput,
): Promise<ProduceListingView | null> {
  await connectToDatabase();

  const current = await ProduceListingModel.findOne({
    _id: listingId,
    farmer: farmerProfileId,
  }).lean();

  if (!current) {
    return null;
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
    variety:
      patch.variety !== undefined ? patch.variety : current.variety,
    quantity: patch.quantity ?? current.quantity,
    unit: patch.unit ?? current.unit,
    quality: patch.quality ?? (current.quality ?? "ungraded"),
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
        district:
          patch.location?.address?.district ?? currentAddress.district ?? "",
        state: patch.location?.address?.state ?? currentAddress.state ?? "",
        pincode:
          patch.location?.address?.pincode !== undefined
            ? patch.location.address.pincode
            : currentAddress.pincode,
      },
      geo: nextGeo,
    },
    expectedHarvestDate:
      patch.expectedHarvestDate !== undefined
        ? patch.expectedHarvestDate
        : toDateOnlyString(current.expectedHarvestDate) ?? todayDateOnly(),
  };

  const cropDefinition = getCropById(next.crop);
  if (
    next.variety &&
    cropDefinition?.varieties &&
    !cropDefinition.varieties.includes(next.variety)
  ) {
    next.variety = undefined;
  }

  const validated = parseOrThrow(produceListingSchema, next);

  const update: Record<string, unknown> = {
    crop: validated.crop,
    quantity: validated.quantity,
    unit: validated.unit,
    quality: validated.quality,
    expectedHarvestDate: new Date(`${validated.expectedHarvestDate}T00:00:00Z`),
    location: toDbLocation(validated.location),
  };

  if (validated.variety !== undefined) {
    update.variety = validated.variety;
  }

  if (patch.status) {
    update.status = patch.status;
  }

  const updated = await ProduceListingModel.findOneAndUpdate(
    { _id: listingId, farmer: farmerProfileId },
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  return updated ? toProduceListingView(updated) : null;
}

export async function setProduceAskingPrice(
  listingId: string,
  farmerProfileId: string,
  pricePerUnit: number,
): Promise<number | null> {
  await connectToDatabase();
  const updated = await ProduceListingModel.findOneAndUpdate(
    { _id: listingId, farmer: farmerProfileId },
    { $set: { pricePerUnit } },
    { new: true },
  ).lean();
  return updated ? Number(updated.pricePerUnit) : null;
}

export async function deleteProduceListing(
  listingId: string,
  farmerProfileId: string,
): Promise<boolean> {
  await connectToDatabase();
  const result = await ProduceListingModel.deleteOne({
    _id: listingId,
    farmer: farmerProfileId,
  });
  if (result.deletedCount === 0) {
    throw new NotFoundError("Listing not found.");
  }
  return true;
}

function toDateOnlyString(value: Date | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}
