import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import {
  NOTIFICATION_TYPE_VALUES,
  type NotificationType,
} from "@/constants/notification-types";
import { MODEL_NAMES } from "./model-names";

export interface Notification {
  recipientId: Schema.Types.ObjectId;
  recipientRole: "farmer" | "vendor" | "admin";
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ["farmer", "vendor", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    entityType: { type: String, maxlength: 50 },
    entityId: { type: String, maxlength: 100 },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<Notification> =
  models[MODEL_NAMES.NOTIFICATION] ??
  model<Notification>(MODEL_NAMES.NOTIFICATION, notificationSchema);
