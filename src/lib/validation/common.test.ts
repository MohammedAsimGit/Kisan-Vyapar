import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { objectIdSchema, parseOrThrow, roleSchema } from "./common";
import { USER_ROLES } from "@/constants/roles";
import { ValidationError } from "@/lib/errors";

describe("shared validation", () => {
  it("accepts known roles", () => {
    expect(roleSchema.safeParse(USER_ROLES.FARMER).success).toBe(true);
    expect(roleSchema.safeParse(USER_ROLES.ADMIN).success).toBe(true);
  });

  it("rejects an unknown role", () => {
    expect(roleSchema.safeParse("superuser").success).toBe(false);
  });

  it("accepts a valid object id", () => {
    const id = new mongoose.Types.ObjectId().toString();
    expect(objectIdSchema.safeParse(id).success).toBe(true);
  });

  it("rejects an invalid object id", () => {
    expect(objectIdSchema.safeParse("not-an-id").success).toBe(false);
  });

  it("parseOrThrow returns data for valid input", () => {
    const schema = roleSchema;
    expect(parseOrThrow(schema, USER_ROLES.FARMER)).toBe(USER_ROLES.FARMER);
  });

  it("parseOrThrow throws a ValidationError for invalid input", () => {
    expect(() => parseOrThrow(roleSchema, "bogus")).toThrow(ValidationError);
  });
});
