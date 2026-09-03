import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  BUYER_REQUIREMENT_STATUS,
  BUYER_REQUIREMENT_STATUS_VALUES,
  type BuyerRequirementStatus,
} from "@/constants/buyer-requirement-statuses";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import { locationDefinition } from "./location-definition";
import { MODEL_NAMES } from "./model-names";

export interface BuyerRequirement {
  vendor: Types.ObjectId;
  crop: string;
  variety?: string;
  quality?: string;
  quantity: number;
  unit: MeasurementUnit;
  maxPricePerUnit: number;
  currency: Currency;
  requiredBy: Date;
  location?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  status: BuyerRequirementStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const buyerRequirementSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.VENDOR_PROFILE,
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
    maxPricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    requiredBy: {
      type: Date,
      required: true,
    },
    location: locationDefinition,
    status: {
      type: String,
      enum: BUYER_REQUIREMENT_STATUS_VALUES,
      default: BUYER_REQUIREMENT_STATUS.DRAFT,
    },
  },
  { timestamps: true },
);

buyerRequirementSchema.index({ vendor: 1, status: 1 });
buyerRequirementSchema.index({ crop: 1, status: 1 });
buyerRequirementSchema.index({ status: 1, requiredBy: 1 });
buyerRequirementSchema.index({ "location.geo": "2dsphere" });

export const BuyerRequirementModel =
  (models[MODEL_NAMES.BUYER_REQUIREMENT] as Model<BuyerRequirement> | undefined) ??
  model<BuyerRequirement>(MODEL_NAMES.BUYER_REQUIREMENT, buyerRequirementSchema);
