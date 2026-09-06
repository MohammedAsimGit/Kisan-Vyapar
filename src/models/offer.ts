import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  OFFER_STATUS,
  OFFER_STATUS_VALUES,
  type OfferStatus,
} from "@/constants/offer-statuses";
import { MODEL_NAMES } from "./model-names";

export const OFFER_PARTY_VALUES = ["farmer", "vendor"] as const;
export type OfferParty = (typeof OFFER_PARTY_VALUES)[number];

export const OFFER_ACTION_VALUES = [
  "offer",
  "counter",
  "accept",
  "reject",
  "withdraw",
] as const;
export type OfferHistoryAction = (typeof OFFER_ACTION_VALUES)[number];

/**
 * One immutable step of a negotiation. Entries are only ever appended — never
 * edited — so the final accepted terms are always traceable to the history.
 */
export interface OfferHistoryEvent {
  party: OfferParty;
  action: OfferHistoryAction;
  quantity: number;
  unit: MeasurementUnit;
  pricePerUnit: number;
  totalAmount: number;
  note?: string;
  at: Date;
}

const offerHistoryEventSchema = new Schema<OfferHistoryEvent>(
  {
    party: {
      type: String,
      enum: OFFER_PARTY_VALUES,
      required: true,
    },
    action: {
      type: String,
      enum: OFFER_ACTION_VALUES,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      enum: MEASUREMENT_UNIT_VALUES,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 400,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

export interface Offer {
  /** The real published produce listing this negotiation is about. */
  produceListing: Types.ObjectId;
  /** The real active buying requirement this negotiation is about. */
  requirement: Types.ObjectId;
  /** Farmer profile of the seller (owner of produceListing). */
  farmer: Types.ObjectId;
  /** Vendor profile of the buyer (owner of requirement). */
  vendor: Types.ObjectId;
  /** Current proposed quantity (mirrors the latest history entry). */
  quantity: number;
  unit: MeasurementUnit;
  /** Current proposed price per unit in the listing's unit (latest proposal). */
  pricePerUnit: number;
  currency: Currency;
  /** Authoritative server-computed total: quantity × pricePerUnit. */
  totalAmount: number;
  status: OfferStatus;
  /** Immutable, append-only negotiation record. */
  history: OfferHistoryEvent[];
  createdAt?: Date;
  updatedAt?: Date;
}

const offerSchema = new Schema<Offer>(
  {
    produceListing: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.PRODUCE_LISTING,
      required: true,
    },
    requirement: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.BUYER_REQUIREMENT,
      required: true,
    },
    farmer: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.FARMER_PROFILE,
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.VENDOR_PROFILE,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      enum: MEASUREMENT_UNIT_VALUES,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: OFFER_STATUS_VALUES,
      default: OFFER_STATUS.PENDING,
    },
    history: {
      type: [offerHistoryEventSchema],
      default: [],
    },
  },
  { timestamps: true },
);

offerSchema.index({ farmer: 1, status: 1, createdAt: -1 });
offerSchema.index({ vendor: 1, status: 1, createdAt: -1 });
offerSchema.index({ requirement: 1, status: 1 });
offerSchema.index({ produceListing: 1, status: 1 });

/**
 * Duplicate-submission guard: at most ONE live negotiation thread per
 * (farmer, produce listing, requirement). Terminal offers drop out of the
 * partial index, so a fresh negotiation is possible once the previous one
 * concluded (e.g. partial fulfilment with remaining demand).
 */
offerSchema.index(
  { produceListing: 1, requirement: 1, farmer: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [OFFER_STATUS.PENDING, OFFER_STATUS.COUNTERED] },
    },
  },
);

export const OfferModel =
  (models[MODEL_NAMES.OFFER] as Model<Offer> | undefined) ??
  model<Offer>(MODEL_NAMES.OFFER, offerSchema);