import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import {
  VENDOR_BUSINESS_TYPE_VALUES,
  type VendorBusinessType,
} from "@/constants/vendor-business-types";
import { locationDefinition } from "./location-definition";
import { MODEL_NAMES } from "./model-names";

export interface VendorProfile {
  user: Types.ObjectId;
  businessName: string;
  businessType?: VendorBusinessType;
  location?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const vendorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    businessType: {
      type: String,
      enum: VENDOR_BUSINESS_TYPE_VALUES,
    },
    location: locationDefinition,
  },
  { timestamps: true },
);

vendorProfileSchema.index({ "location.geo": "2dsphere" });

export const VendorProfileModel =
  (models[MODEL_NAMES.VENDOR_PROFILE] as Model<VendorProfile> | undefined) ??
  model<VendorProfile>(MODEL_NAMES.VENDOR_PROFILE, vendorProfileSchema);
