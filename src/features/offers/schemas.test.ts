import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import {
  counterOfferSchema,
  createOfferSchema,
  offerListQuerySchema,
} from "./schemas";

const id = () => new Types.ObjectId().toString();

const validCreate = {
  produceId: id(),
  requirementId: id(),
  quantity: 20,
  pricePerUnit: 2750,
};

describe("createOfferSchema", () => {
  it("accepts a valid offer", () => {
    const result = createOfferSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it("rejects non-positive quantity", () => {
    expect(createOfferSchema.safeParse({ ...validCreate, quantity: 0 }).success).toBe(false);
    expect(createOfferSchema.safeParse({ ...validCreate, quantity: -5 }).success).toBe(false);
  });

  it("rejects non-positive price", () => {
    expect(createOfferSchema.safeParse({ ...validCreate, pricePerUnit: 0 }).success).toBe(false);
    expect(createOfferSchema.safeParse({ ...validCreate, pricePerUnit: -100 }).success).toBe(false);
  });

  it("rejects malformed object ids", () => {
    expect(createOfferSchema.safeParse({ ...validCreate, produceId: "not-an-id" }).success).toBe(false);
    expect(createOfferSchema.safeParse({ ...validCreate, requirementId: "nope" }).success).toBe(false);
  });

  it("accepts an optional note and strips empty notes", () => {
    const withNote = createOfferSchema.safeParse({ ...validCreate, note: "Can deliver this week" });
    expect(withNote.success).toBe(true);
    if (withNote.success) {
      expect(withNote.data.note).toBe("Can deliver this week");
    }
    const emptyNote = createOfferSchema.safeParse({ ...validCreate, note: "" });
    expect(emptyNote.success).toBe(true);
    if (emptyNote.success) {
      expect(emptyNote.data.note).toBeUndefined();
    }
  });

  it("rejects over-long notes", () => {
    expect(
      createOfferSchema.safeParse({ ...validCreate, note: "x".repeat(401) }).success,
    ).toBe(false);
  });
});

describe("counterOfferSchema", () => {
  const base = { quantity: 20, pricePerUnit: 2700 };

  it("accepts a full counter", () => {
    expect(counterOfferSchema.safeParse(base).success).toBe(true);
  });

  it("accepts changing only quantity or only price", () => {
    expect(counterOfferSchema.safeParse({ quantity: 15 }).success).toBe(true);
    expect(counterOfferSchema.safeParse({ pricePerUnit: 2800 }).success).toBe(true);
  });

  it("rejects a counter that changes nothing", () => {
    const result = counterOfferSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Change at least"))).toBe(true);
    }
  });

  it("rejects invalid quantities and prices", () => {
    expect(counterOfferSchema.safeParse({ quantity: 0 }).success).toBe(false);
    expect(counterOfferSchema.safeParse({ pricePerUnit: -1 }).success).toBe(false);
  });

  it("accepts an optional note", () => {
    expect(counterOfferSchema.safeParse({ ...base, note: "Meet halfway?" }).success).toBe(true);
  });
});

describe("offerListQuerySchema", () => {
  it("defaults page and limit", () => {
    const result = offerListQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("coerces string page numbers", () => {
    const result = offerListQuerySchema.safeParse({ page: "3", limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it("rejects out-of-range limits and invalid requirement ids", () => {
    expect(offerListQuerySchema.safeParse({ limit: 500 }).success).toBe(false);
    expect(offerListQuerySchema.safeParse({ requirementId: "bad" }).success).toBe(false);
  });
});