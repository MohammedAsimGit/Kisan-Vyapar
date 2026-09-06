import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { OfferHistoryAction, OfferParty } from "@/models/offer";
import {
  OFFER_STATUS,
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/constants/offer-statuses";
import type { ProduceListingStatus } from "@/constants/produce-listing-statuses";
import type { QualityGrade } from "@/constants/quality-grades";
import { toBuyerRequirementView } from "@/features/buyer-requirements/types";
import { toProduceListingView } from "@/features/produce/types";
import type { ProduceListingView } from "@/features/produce/types";

export const OFFER_ACTION_LABELS: Record<OfferHistoryAction, string> = {
  offer: "Offer",
  counter: "Counter",
  accept: "Accept",
  reject: "Reject",
  withdraw: "Withdraw",
};

export const OFFER_PARTY_LABELS: Record<OfferParty, string> = {
  farmer: "Farmer",
  vendor: "Buyer",
};

export interface OfferHistoryView {
  party: OfferParty;
  partyLabel: string;
  action: OfferHistoryAction;
  actionLabel: string;
  quantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  pricePerUnit: number;
  totalAmount: number;
  note?: string;
  /** ISO timestamp of the step. */
  at: string;
}

/**
 * Location kept for the informational Sprint 5 match score. Coordinates are
 * only ever included when real — never [0,0] placeholders.
 */
export interface OfferLocationView {
  district?: string;
  state?: string;
  geo?: { coordinates: [number, number] } | null;
}

export interface OfferProduceView {
  id: string;
  crop: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  quality: QualityGrade;
  qualityLabel: string;
  quantity: number;
  availableQuantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  askingPricePerUnit?: number;
  locationText?: string;
  location: OfferLocationView;
  expectedHarvestDate?: string;
  status: ProduceListingStatus;
}

export interface OfferRequirementView {
  id: string;
  crop: string;
  cropName: string;
  quality: QualityGrade;
  qualityLabel: string;
  quantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  targetPriceMin: number;
  targetPriceMax: number;
  requiredBy: string;
  remainingQuantity: number;
  locationText?: string;
  location: OfferLocationView;
  status: BuyerRequirementStatus;
}

export interface OfferView {
  id: string;
  status: OfferStatus;
  statusLabel: string;
  quantity: number;
  unit: MeasurementUnit;
  unitLabel: string;
  pricePerUnit: number;
  currency: string;
  totalAmount: number;
  produce: OfferProduceView;
  requirement: OfferRequirementView;
  farmer: { farmerName?: string };
  vendor: { businessName?: string };
  history: OfferHistoryView[];
  /** Whose response is awaited; null once the negotiation is terminal. */
  turn: OfferParty | null;
  createdAt: string;
  updatedAt: string;
}

/** Real coordinates only — mirrors the matching service's honesty rule. */
export function realCoordinatesOf(
  geo: { type?: string; coordinates?: number[] } | null | undefined,
): [number, number] | undefined {
  const coordinates = geo?.coordinates;
  if (
    !coordinates ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    return undefined;
  }
  if (coordinates[0] === 0 && coordinates[1] === 0) {
    return undefined;
  }
  return [coordinates[0], coordinates[1]];
}

/** Whose response the current offer state is waiting for. */
export function partyToRespond(status: OfferStatus): OfferParty | null {
  if (status === OFFER_STATUS.PENDING) {
    return "vendor";
  }
  if (status === OFFER_STATUS.COUNTERED) {
    return "farmer";
  }
  return null;
}

export interface OfferViewContext {
  /** Lean ProduceListing doc the offer references. */
  produce: {
    _id: unknown;
    crop: string;
    variety?: string;
    quality?: QualityGrade;
    quantity: number;
    committedQuantity?: number;
    unit: MeasurementUnit;
    pricePerUnit?: number | null;
    status: ProduceListingStatus;
    expectedHarvestDate?: Date | null;
    location?: {
      label?: string;
      geo?: { type?: string; coordinates?: number[] } | null;
      address?: {
        village?: string;
        district?: string;
        state?: string;
        pincode?: string;
      };
    };
    createdAt?: Date | null;
    updatedAt?: Date | null;
  };
  /** Lean BuyerRequirement doc the offer references. */
  requirement: {
    _id: unknown;
    crop: string;
    quality?: QualityGrade;
    quantity: number;
    unit: MeasurementUnit;
    allocatedQuantity?: number;
    targetPriceMin: number;
    targetPriceMax: number;
    requiredBy: Date | string;
    status: BuyerRequirementStatus;
    location?: {
      label?: string;
      geo?: { type?: string; coordinates?: number[] } | null;
      address?: {
        village?: string;
        district?: string;
        state?: string;
        pincode?: string;
      };
    };
    createdAt?: Date | null;
    updatedAt?: Date | null;
  };
  farmerName?: string;
  businessName?: string;
}

interface OfferDocShape {
  _id: unknown;
  produceListing: unknown;
  requirement: unknown;
  farmer: unknown;
  vendor: unknown;
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

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  kg: "Kg",
  quintal: "Quintal",
  tonne: "Tonne",
};

export function toOfferView(doc: OfferDocShape, context: OfferViewContext): OfferView {
  const produceView: ProduceListingView = toProduceListingView(context.produce);
  const requirementView = toBuyerRequirementView(context.requirement);

  const produceLocation = context.produce.location;
  const requirementLocation = context.requirement.location;
  const produceGeo = realCoordinatesOf(produceLocation?.geo);
  const requirementGeo = realCoordinatesOf(requirementLocation?.geo);

  const history: OfferHistoryView[] = (doc.history ?? []).map((event) => ({
    party: event.party,
    partyLabel: OFFER_PARTY_LABELS[event.party],
    action: event.action,
    actionLabel: OFFER_ACTION_LABELS[event.action],
    quantity: event.quantity,
    unit: event.unit,
    unitLabel: UNIT_LABELS[event.unit] ?? event.unit,
    pricePerUnit: event.pricePerUnit,
    totalAmount: event.totalAmount,
    note: event.note,
    at: event.at.toISOString(),
  }));

  const allocated = context.requirement.allocatedQuantity ?? 0;

  return {
    id: String(doc._id),
    status: doc.status,
    statusLabel: OFFER_STATUS_LABELS[doc.status],
    quantity: doc.quantity,
    unit: doc.unit,
    unitLabel: UNIT_LABELS[doc.unit] ?? doc.unit,
    pricePerUnit: doc.pricePerUnit,
    currency: doc.currency ?? "INR",
    totalAmount: doc.totalAmount,
    produce: {
      id: produceView.id,
      crop: produceView.crop,
      cropName: produceView.cropName,
      cropEmoji: produceView.cropEmoji,
      variety: produceView.variety,
      quality: context.produce.quality ?? "ungraded",
      qualityLabel: produceView.qualityLabel,
      quantity: produceView.quantity,
      availableQuantity: produceView.availableQuantity,
      unit: produceView.unit,
      unitLabel: produceView.unitLabel,
      askingPricePerUnit: produceView.askingPrice,
      locationText: produceView.locationText || undefined,
      location: {
        district: produceLocation?.address?.district,
        state: produceLocation?.address?.state,
        geo: produceGeo ? { coordinates: produceGeo } : null,
      },
      expectedHarvestDate: produceView.expectedHarvestDate,
      status: produceView.status,
    },
    requirement: {
      id: requirementView.id,
      crop: requirementView.crop,
      cropName: requirementView.cropName,
      quality: context.requirement.quality ?? "ungraded",
      qualityLabel: requirementView.qualityLabel,
      quantity: requirementView.quantity,
      unit: requirementView.unit,
      unitLabel: requirementView.unitLabel,
      targetPriceMin: requirementView.targetPriceMin,
      targetPriceMax: requirementView.targetPriceMax,
      requiredBy: requirementView.requiredBy,
      remainingQuantity: Math.max(0, requirementView.quantity - allocated),
      locationText: requirementView.locationText || undefined,
      location: {
        district: requirementLocation?.address?.district,
        state: requirementLocation?.address?.state,
        geo: requirementGeo ? { coordinates: requirementGeo } : null,
      },
      status: requirementView.status,
    },
    farmer: { farmerName: context.farmerName },
    vendor: { businessName: context.businessName },
    history,
    turn: partyToRespond(doc.status),
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : "",
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : "",
  };
}