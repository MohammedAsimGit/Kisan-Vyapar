import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import { CURRENCIES, CURRENCY_VALUES, type Currency } from "@/constants/currencies";
import {
  MEASUREMENT_UNIT_VALUES,
  type MeasurementUnit,
} from "@/constants/measurement-units";
import {
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  type OrderStatus,
} from "@/constants/order-statuses";
import { MODEL_NAMES } from "./model-names";

export interface Order {
  orderNumber?: string;
  produceListing: Types.ObjectId;
  offer?: Types.ObjectId;
  seller: Types.ObjectId;
  buyer: Types.ObjectId;
  quantity: number;
  unit: MeasurementUnit;
  agreedPricePerUnit: number;
  currency: Currency;
  totalValue: number;
  status: OrderStatus;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    produceListing: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.PRODUCE_LISTING,
      required: true,
    },
    offer: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.OFFER,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
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
    agreedPricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: CURRENCY_VALUES,
      default: CURRENCIES.INR,
    },
    totalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: ORDER_STATUS.PENDING,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 400,
    },
  },
  { timestamps: true },
);

orderSchema.index({ seller: 1, status: 1 });
orderSchema.index({ buyer: 1, status: 1 });
orderSchema.index({ produceListing: 1, status: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });

export const OrderModel =
  (models[MODEL_NAMES.ORDER] as Model<Order> | undefined) ??
  model<Order>(MODEL_NAMES.ORDER, orderSchema);
