import "server-only";
import { Schema, model, models, type Model, type Types } from "mongoose";
import { MODEL_NAMES } from "./model-names";

export interface Session {
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: MODEL_NAMES.USER,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ tokenHash: 1 }, { unique: true });
// MongoDB TTL index: documents are removed automatically after expiry.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel =
  (models[MODEL_NAMES.SESSION] as Model<Session> | undefined) ??
  model<Session>(MODEL_NAMES.SESSION, sessionSchema);
