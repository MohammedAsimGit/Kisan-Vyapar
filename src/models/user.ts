import "server-only";
import { Schema, model, models, type Model } from "mongoose";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_VALUES,
} from "@/constants/languages";
import { USER_ROLE_VALUES, type UserRole } from "@/constants/roles";
import { USER_STATUSES, USER_STATUS_VALUES, type UserStatus } from "@/constants/user-statuses";
import type { SupportedLanguage } from "@/constants/languages";
import { MODEL_NAMES } from "./model-names";

export interface User {
  role: UserRole;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  email?: string;
  passwordHash?: string;
  language?: SupportedLanguage;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [PHONE_PATTERN, "Phone number must contain 10 to 15 digits, optionally prefixed with +"],
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "Email address must be valid"],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    language: {
      type: String,
      enum: SUPPORTED_LANGUAGE_VALUES,
      default: SUPPORTED_LANGUAGES.ENGLISH,
    },
    status: {
      type: String,
      enum: USER_STATUS_VALUES,
      default: USER_STATUSES.ACTIVE,
    },
  },
  { timestamps: true },
);

userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });

export const UserModel =
  (models[MODEL_NAMES.USER] as Model<User> | undefined) ??
  model<User>(MODEL_NAMES.USER, userSchema);
