import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  LOGISTICS_STATUS,
  LOGISTICS_STATUS_VALUES,
  type LogisticsStatus,
} from "@/constants/logistics-statuses";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import type { GeoPoint, PostalAddress } from "@/types/geo";
import { locationDefinition } from "./location-definition";
import { MODEL_NAMES } from "./model-names";

export interface Logistics {
  orderId: Types.ObjectId;
  farmerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  quantity: number;
  unit: MeasurementUnit;
  currency: Currency;
  /** Human-readable crop name, denormalised for fast reads. */
  cropName: string;
  pickup: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  delivery: {
    label?: string;
    geo?: GeoPoint;
    address?: PostalAddress;
  };
  /** Distance in km, computed only from real coordinates. Null when unavailable. */
  distanceKm?: number | null;
  vehicleType?: string;
  /** Estimated transport cost in INR. Null when not yet calculated. */
  estimatedTransportCost?: number | null;
  pickupScheduledAt?: Date;
  estimatedDeliveryAt?: Date;
  status: LogisticsStatus;
  /** External notes from the farmer or vendor. */
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const logisticsSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.ORDER,
      required: true,
    },
    farmerId: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.FARMER_PROFILE,
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.VENDOR_PROFILE,
      required: true,
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
    cropName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    pickup: locationDefinition,
    delivery: locationDefinition,
    distanceKm: {
      type: Number,
      min: 0,
    },
    vehicleType: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    estimatedTransportCost: {
      type: Number,
      min: 0,
    },
    pickupScheduledAt: {
      type: Date,
    },
    estimatedDeliveryAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: LOGISTICS_STATUS_VALUES,
      default: LOGISTICS_STATUS.PENDING,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

logisticsSchema.index({ orderId: 1 }, { unique: true });
logisticsSchema.index({ farmerId: 1, status: 1 });
logisticsSchema.index({ vendorId: 1, status: 1 });
logisticsSchema.index({ status: 1, createdAt: -1 });

export const LogisticsModel =
  (models[MODEL_NAMES.LOGISTICS] as Model<Logistics> | undefined) ??
  model<Logistics>(MODEL_NAMES.LOGISTICS, logisticsSchema);
