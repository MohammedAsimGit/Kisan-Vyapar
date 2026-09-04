import { describe, expect, it } from "vitest";
import { produceListingSchema, produceListingUpdateSchema } from "./schemas";

function without(
  input: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const copy = { ...input };
  delete copy[key];
  return copy;
}

const validListing = {
  crop: "tomato",
  variety: "Hybrid",
  quantity: 20,
  unit: "quintal",
  quality: "a",
  location: {
    label: "Devanahalli",
    address: {
      village: "Devanahalli",
      district: "Bengaluru Rural",
      state: "Karnataka",
      pincode: "562110",
    },
  },
  expectedHarvestDate: "2026-09-20",
};

describe("produce listing schema", () => {
  it("accepts a valid listing", () => {
    expect(produceListingSchema.safeParse(validListing).success).toBe(true);
  });

  it("accepts a missing optional variety", () => {
    expect(produceListingSchema.safeParse(without(validListing, "variety")).success).toBe(true);
  });

  it("rejects an unsupported crop", () => {
    expect(
      produceListingSchema.safeParse({ ...validListing, crop: "not-a-crop" }).success,
    ).toBe(false);
  });

  it("rejects a missing crop", () => {
    expect(produceListingSchema.safeParse(without(validListing, "crop")).success).toBe(false);
  });

  it("rejects zero or negative quantity", () => {
    expect(
      produceListingSchema.safeParse({ ...validListing, quantity: 0 }).success,
    ).toBe(false);
    expect(
      produceListingSchema.safeParse({ ...validListing, quantity: -5 }).success,
    ).toBe(false);
  });

  it("rejects a non-numeric quantity", () => {
    expect(
      produceListingSchema.safeParse({ ...validListing, quantity: "many" }).success,
    ).toBe(false);
  });

  it("rejects an unsupported unit", () => {
    expect(
      produceListingSchema.safeParse({ ...validListing, unit: "litre" }).success,
    ).toBe(false);
  });

  it("rejects an invalid quality", () => {
    expect(
      produceListingSchema.safeParse({ ...validListing, quality: "superb" }).success,
    ).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(
      produceListingSchema.safeParse({
        ...validListing,
        expectedHarvestDate: "2026-20-99",
      }).success,
    ).toBe(false);
  });

  it("rejects a missing date", () => {
    expect(produceListingSchema.safeParse(without(validListing, "expectedHarvestDate")).success).toBe(false);
  });

  it("update schema allows partial payloads plus status transitions", () => {
    expect(
      produceListingUpdateSchema.safeParse({ quantity: 25 }).success,
    ).toBe(true);
    expect(
      produceListingUpdateSchema.safeParse({ status: "withdrawn" }).success,
    ).toBe(true);
    expect(
      produceListingUpdateSchema.safeParse({ status: "sold_out" }).success,
    ).toBe(false);
  });
});
