import mongoose from "mongoose";
import { z } from "zod";
import { USER_ROLE_VALUES } from "@/constants/roles";
import { ValidationError } from "@/lib/errors";

export const objectIdSchema = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), {
    message: "Value must be a valid object id.",
  });

export const roleSchema = z.enum(USER_ROLE_VALUES);

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Validation failed.", result.error.issues);
  }
  return result.data;
}
