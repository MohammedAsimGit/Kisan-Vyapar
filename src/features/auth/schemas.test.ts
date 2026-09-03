import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "./schemas";
import { USER_ROLES } from "@/constants/roles";

describe("register schema", () => {
  const valid = {
    fullName: "Ramesh Kumar",
    phone: "9876543210",
    email: "",
    password: "Farm1234",
    role: USER_ROLES.FARMER,
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a weak password", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
  });

  it("rejects a password without a number", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "onlyletters" }).success,
    ).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    expect(
      registerSchema.safeParse({ ...valid, phone: "123" }).success,
    ).toBe(false);
  });

  it("rejects a role that is not farmer or vendor (admin not self-serve)", () => {
    expect(
      registerSchema.safeParse({ ...valid, role: USER_ROLES.ADMIN }).success,
    ).toBe(false);
  });

  it("rejects an invalid email when provided", () => {
    expect(
      registerSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("rejects when the name is missing", () => {
    const rest = {
      phone: valid.phone,
      email: valid.email,
      password: valid.password,
      role: valid.role,
    };
    expect(registerSchema.safeParse(rest).success).toBe(false);
  });
});

describe("login schema", () => {
  it("accepts a phone identifier with a password", () => {
    expect(
      loginSchema.safeParse({ identifier: "9876543210", password: "Farm1234" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(
      loginSchema.safeParse({ identifier: "9876543210", password: "" }).success,
    ).toBe(false);
  });
});
