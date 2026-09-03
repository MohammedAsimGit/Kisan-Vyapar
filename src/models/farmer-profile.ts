import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import { locationDefinition } from "./location-definition";
import { MODEL_NAMES } from "./model-names";

export interface FarmerProfile {
  user: Types.ObjectId;
  bio?: string;
  location?: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const farmerProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
      unique: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    location: locationDefinition,
  },
  { timestamps: true },
);

farmerProfileSchema.index({ "location.geo": "2dsphere" });

export const FarmerProfileModel =
  (models[MODEL_NAMES.FARMER_PROFILE] as Model<FarmerProfile> | undefined) ??
  model<FarmerProfile>(MODEL_NAMES.FARMER_PROFILE, farmerProfileSchema);
