import { getCropById } from "@/constants/crops";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { ProduceListingStatus } from "@/constants/produce-listing-statuses";
import { getQualityGradeLabel, type QualityGrade } from "@/constants/quality-grades";

export const UNIT_LABELS: Record<MeasurementUnit, string> = {
  kg: "Kg",
  quintal: "Quintal",
  tonne: "Tonne",
};

export interface ProduceLocationView {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  label?: string;
}

export interface ProduceListingView {
  id: string;
  crop: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  quantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  quality: QualityGrade;
  qualityLabel: string;
  location: ProduceLocationView;
  locationText: string;
  expectedHarvestDate?: string;
  status: ProduceListingStatus;
  createdAt: string;
  updatedAt: string;
}

type ListingDocShape = {
  _id: unknown;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  expectedHarvestDate?: Date | null;
  location?: {
    label?: string;
    address?: {
      village?: string;
      district?: string;
      state?: string;
      pincode?: string;
    };
  };
  status: ProduceListingStatus;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export function toDateOnly(value: Date | string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function produceLocationText(location: ListingDocShape["location"]): string {
  const address = location?.address;
  const parts = [location?.label, address?.village, address?.district, address?.state].filter(
    (part): part is string => Boolean(part),
  );
  return parts.join(", ");
}

export function toProduceListingView(doc: ListingDocShape): ProduceListingView {
  const cropDef = getCropById(doc.crop);
  const address = doc.location?.address;

  return {
    id: String(doc._id),
    crop: doc.crop,
    cropName: cropDef?.name ?? doc.crop,
    cropEmoji: cropDef?.emoji,
    variety: doc.variety,
    quantity: doc.quantity,
    unit: doc.unit,
    unitLabel: UNIT_LABELS[doc.unit] ?? doc.unit,
    quality: doc.quality ?? "ungraded",
    qualityLabel: getQualityGradeLabel(doc.quality),
    location: {
      village: address?.village,
      district: address?.district,
      state: address?.state,
      pincode: address?.pincode,
      label: doc.location?.label,
    },
    locationText: produceLocationText(doc.location),
    expectedHarvestDate: toDateOnly(doc.expectedHarvestDate),
    status: doc.status,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : "",
  };
}
