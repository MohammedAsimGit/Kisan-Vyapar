import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { UserModel, type User } from "@/models/user";
import { USER_ROLES } from "@/constants/roles";

const asPayload = (value: Record<string, unknown>) => value as unknown as Partial<User>;

describe("User model validation", () => {
  it("accepts a valid farmer user without touching the database", async () => {
    const doc = new UserModel(
      asPayload({
        role: USER_ROLES.FARMER,
        fullName: "Ramesh Kumar",
        phone: "9876543210",
      }),
    );
    await expect(doc.validate()).resolves.toBeUndefined();
  });

  it("rejects an unknown role", async () => {
    const doc = new UserModel(
      asPayload({
        role: "superuser",
        fullName: "Ramesh Kumar",
        phone: "9876543210",
      }),
    );
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects an invalid phone number", async () => {
    const doc = new UserModel(
      asPayload({
        role: USER_ROLES.VENDOR,
        fullName: "Ramesh Kumar",
        phone: "not-a-phone",
      }),
    );
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects when full name is missing", async () => {
    const doc = new UserModel(
      asPayload({ role: USER_ROLES.FARMER, phone: "9876543210" }),
    );
    await expect(doc.validate()).rejects.toThrow();
  });

  it("rejects an invalid email address", async () => {
    const doc = new UserModel(
      asPayload({
        role: USER_ROLES.FARMER,
        fullName: "Ramesh Kumar",
        phone: "9876543210",
        email: "not-an-email",
      }),
    );
    await expect(doc.validate()).rejects.toThrow();
  });

  it("does not include the password hash by default (select:false)", () => {
    const path = UserModel.schema.path("passwordHash") as unknown as {
      options: { select: boolean };
    };
    expect(path.options.select).toBe(false);
  });

  it("uses a valid ObjectId for the mongoose instance", () => {
    expect(mongoose.isValidObjectId(new mongoose.Types.ObjectId().toString())).toBe(true);
  });
});
