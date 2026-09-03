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

export interface Offer {
  produceListing: Types.ObjectId;
  vendor: Types.ObjectId;
  offeredPricePerUnit: number;
  quantity: number;
  unit: MeasurementUnit;
  currency: Currency;
  validUntil?: Date;
  message?: string;
  status: OfferStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const offerSchema = new Schema(
  {
    produceListing: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.PRODUCE_LISTING,
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.VENDOR_PROFILE,
      required: true,
    },
    offeredPricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: MEASUREMENT_UNIT_VALUES,
      required: true,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    validUntil: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    status: {
      type: String,
      enum: OFFER_STATUS_VALUES,
      default: OFFER_STATUS.PENDING,
    },
  },
  { timestamps: true },
);

offerSchema.index({ produceListing: 1, status: 1 });
offerSchema.index({ vendor: 1, status: 1 });
offerSchema.index({ status: 1, createdAt: -1 });

export const OfferModel =
  (models[MODEL_NAMES.OFFER] as Model<Offer> | undefined) ??
  model<Offer>(MODEL_NAMES.OFFER, offerSchema);
