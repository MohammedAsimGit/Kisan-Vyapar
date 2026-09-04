import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import { MODEL_NAMES } from "./model-names";

export interface MarketPrice {
  commodity: string;
  crop?: string;
  variety?: string;
  grade?: string;
  market: string;
  district?: string;
  state?: string;
  unit: MeasurementUnit;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  currency: Currency;
  arrivalDate?: Date;
  source?: string;
  fetchedAt: Date;
  recordKey?: string;
  externalId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const marketPriceSchema = new Schema(
  {
    commodity: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    crop: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 60,
    },
    variety: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    grade: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    market: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    district: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    state: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    unit: {
      type: String,
      enum: MEASUREMENT_UNIT_VALUES,
      required: true,
    },
    minPrice: {
      type: Number,
      min: 0,
    },
    maxPrice: {
      type: Number,
      min: 0,
    },
    modalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    arrivalDate: {
      type: Date,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    recordKey: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    externalId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true },
);

marketPriceSchema.index({ crop: 1, state: 1, district: 1, arrivalDate: -1 });
marketPriceSchema.index({ commodity: 1, state: 1, market: 1, arrivalDate: -1 });
marketPriceSchema.index({ recordKey: 1 }, { unique: true, sparse: true });
marketPriceSchema.index({ externalId: 1 }, { unique: true, sparse: true });

export const MarketPriceModel =
  (models[MODEL_NAMES.MARKET_PRICE] as Model<MarketPrice> | undefined) ??
  model<MarketPrice>(MODEL_NAMES.MARKET_PRICE, marketPriceSchema);
