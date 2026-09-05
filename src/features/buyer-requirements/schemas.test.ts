import { describe, expect, it } from "vitest";
import {
  buyerRequirementSchema,
  buyerRequirementUpdateSchema,
} from "./schemas";

function futureDate(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const validInput = {
  crop: "tomato",
  quality: "a",
  quantity: 50,
  unit: "quintal",
  targetPriceMin: 2600,
  targetPriceMax: 2800,
  requiredBy: futureDate(10),
  notes: "",
  location: {
    label: "Pimpalgaon",
    address: {
      village: "Pimpalgaon",
      district: "Nashik",
      state: "Maharashtra",
      pincode: "422003",
    },
  },
};

describe("buyerRequirementSchema", () => {
  it("accepts a valid requirement", () => {
    const result = buyerRequirementSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.crop).toBe("tomato");
      expect(["", undefined]).toContain(result.data.notes);
    }
  });

  it("rejects an unsupported crop", () => {
    const result = buyerRequirementSchema.safeParse({ ...validInput, crop: "unicorn" });
    expect(result.success).toBe(false);
  });

  it("rejects a past required-by date", () => {
    const result = buyerRequirementSchema.safeParse({
      ...validInput,
      requiredBy: futureDate(-1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a target range where max is below min", () => {
    const result = buyerRequirementSchema.safeParse({
      ...validInput,
      targetPriceMin: 2800,
      targetPriceMax: 2600,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((item) => item.path[0] === "targetPriceMax");
      expect(issue?.message).toContain("maximum price must be at least");
    }
  });

  it("rejects zero or negative quantity", () => {
    expect(buyerRequirementSchema.safeParse({ ...validInput, quantity: 0 }).success).toBe(false);
    expect(buyerRequirementSchema.safeParse({ ...validInput, quantity: -5 }).success).toBe(false);
  });

  it("rejects an invalid unit", () => {
    expect(buyerRequirementSchema.safeParse({ ...validInput, unit: "bags" }).success).toBe(false);
  });

  it("rejects an invalid quality grade", () => {
    expect(buyerRequirementSchema.safeParse({ ...validInput, quality: "premium" }).success).toBe(false);
  });

  it("rejects missing district or state", () => {
    expect(
      buyerRequirementSchema.safeParse({
        ...validInput,
        location: {
          address: { village: "Pimpalgaon", district: "", state: "Maharashtra" },
        },
      }).success,
    ).toBe(false);
  });

  it("strips unknown fields rather than storing them", () => {
    const result = buyerRequirementSchema.safeParse({ ...validInput, hackerField: "x" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("hackerField" in result.data).toBe(false);
    }
  });
});

describe("buyerRequirementUpdateSchema", () => {
  it("allows editing a single field (e.g. only quantity)", () => {
    const result = buyerRequirementUpdateSchema.safeParse({ quantity: 80 });
    expect(result.success).toBe(true);
  });

  it("re-checks the range only when both bounds are present", () => {
    expect(buyerRequirementUpdateSchema.safeParse({ targetPriceMin: 2900 }).success).toBe(true);
    expect(
      buyerRequirementUpdateSchema.safeParse({ targetPriceMax: 2600 }).success,
    ).toBe(true);
    const both = buyerRequirementUpdateSchema.safeParse({
      targetPriceMin: 2900,
      targetPriceMax: 2600,
    });
    expect(both.success).toBe(false);
  });

  it("rejects editing requiredBy into the past", () => {
    const result = buyerRequirementUpdateSchema.safeParse({
      requiredBy: futureDate(-2),
    });
    expect(result.success).toBe(false);
  });
});
