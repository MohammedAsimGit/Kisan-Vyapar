import { getCropById } from "@/constants/crops";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { QualityGrade } from "@/constants/quality-grades";
import { getQualityGradeLabel } from "@/constants/quality-grades";

export const REQUIREMENT_UNIT_LABELS: Record<MeasurementUnit, string> = {
  kg: "Kg",
  quintal: "Quintal",
  tonne: "Tonne",
};

export interface BuyerRequirementLocationView {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  label?: string;
}

export interface BuyerRequirementView {
  id: string;
  crop: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  quality: QualityGrade;
  qualityLabel: string;
  quantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  targetPriceMin: number;
  targetPriceMax: number;
  currency: string;
  location: BuyerRequirementLocationView;
  locationText: string;
  requiredBy: string;
  notes?: string;
  status: BuyerRequirementStatus;
  createdAt: string;
  updatedAt: string;
}

type RequirementDocShape = {
  _id: unknown;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  targetPriceMin: number;
  targetPriceMax: number;
  currency?: string;
  requiredBy: Date | string;
  notes?: string | null;
  location?: {
    label?: string;
    address?: {
      village?: string;
      district?: string;
      state?: string;
      pincode?: string;
    };
  };
  status: BuyerRequirementStatus;
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

export function requirementLocationText(
  location: RequirementDocShape["location"],
): string {
  const address = location?.address;
  const parts = [location?.label, address?.village, address?.district, address?.state].filter(
    (part): part is string => Boolean(part),
  );
  return parts.join(", ");
}

export function toBuyerRequirementView(doc: RequirementDocShape): BuyerRequirementView {
  const cropDef = getCropById(doc.crop);
  const address = doc.location?.address;

  return {
    id: String(doc._id),
    crop: doc.crop,
    cropName: cropDef?.name ?? doc.crop,
    cropEmoji: cropDef?.emoji,
    variety: doc.variety,
    quality: doc.quality ?? "ungraded",
    qualityLabel: getQualityGradeLabel(doc.quality),
    quantity: doc.quantity,
    unit: doc.unit,
    unitLabel: REQUIREMENT_UNIT_LABELS[doc.unit] ?? doc.unit,
    targetPriceMin: doc.targetPriceMin,
    targetPriceMax: doc.targetPriceMax,
    currency: doc.currency ?? "INR",
    location: {
      village: address?.village,
      district: address?.district,
      state: address?.state,
      pincode: address?.pincode,
      label: doc.location?.label,
    },
    locationText: requirementLocationText(doc.location),
    requiredBy: toDateOnly(doc.requiredBy) ?? "",
    notes: doc.notes ?? undefined,
    status: doc.status,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : "",
  };
}
