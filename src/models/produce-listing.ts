import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  PRODUCE_LISTING_STATUS,
  PRODUCE_LISTING_STATUS_VALUES,
  type ProduceListingStatus,
} from "@/constants/produce-listing-statuses";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import { locationDefinition } from "./location-definition";
import { MODEL_NAMES } from "./model-names";

export interface ProduceListing {
  farmer: Types.ObjectId;
  crop: string;
  variety?: string;
  quality?: string;
  quantity: number;
  unit: MeasurementUnit;
  pricePerUnit: number;
  currency: Currency;
  images: string[];
  availableFrom?: Date;
  location?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  status: ProduceListingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const produceListingSchema = new Schema(
  {
    farmer: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.FARMER_PROFILE,
      required: true,
    },
    crop: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    variety: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    quality: {
      type: String,
      trim: true,
      maxlength: 400,
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
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    images: {
      type: [String],
      default: [],
    },
    availableFrom: {
      type: Date,
    },
    location: locationDefinition,
    status: {
      type: String,
      enum: PRODUCE_LISTING_STATUS_VALUES,
      default: PRODUCE_LISTING_STATUS.DRAFT,
    },
  },
  { timestamps: true },
);

produceListingSchema.index({ farmer: 1, status: 1 });
produceListingSchema.index({ crop: 1, status: 1 });
produceListingSchema.index({ status: 1, createdAt: -1 });
produceListingSchema.index({ "location.geo": "2dsphere" });

export const ProduceListingModel =
  (models[MODEL_NAMES.PRODUCE_LISTING] as Model<ProduceListing> | undefined) ??
  model<ProduceListing>(MODEL_NAMES.PRODUCE_LISTING, produceListingSchema);
