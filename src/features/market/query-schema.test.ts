import { describe, expect, it } from "vitest";
import { marketPricesQuerySchema } from "./query-schema";

function toObject(entries: [string, string][]): Record<string, string> {
  return Object.fromEntries(entries);
}

describe("market prices query schema", () => {
  it("accepts a valid crop filter", () => {
    expect(
      marketPricesQuerySchema.safeParse(toObject([["crop", "tomato"]])).success,
    ).toBe(true);
  });

  it("rejects an unknown crop", () => {
    expect(
      marketPricesQuerySchema.safeParse(toObject([["crop", "unicorn"]])).success,
    ).toBe(false);
  });

  it("accepts state, district and market filters", () => {
    expect(
      marketPricesQuerySchema.safeParse(
        toObject([
          ["crop", "tomato"],
          ["state", "Karnataka"],
          ["district", "Bangalore"],
          ["market", "Bangalore APMC"],
        ]),
      ).success,
    ).toBe(true);
  });

  it("defaults the limit to 25", () => {
    const parsed = marketPricesQuerySchema.safeParse(toObject([]));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(25);
    }
  });

  it("accepts an explicit numeric limit", () => {
    const parsed = marketPricesQuerySchema.safeParse(toObject([["limit", "50"]]));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(50);
    }
  });

  it("rejects a limit outside the allowed range", () => {
    expect(
      marketPricesQuerySchema.safeParse(toObject([["limit", "500"]])).success,
    ).toBe(false);
    expect(
      marketPricesQuerySchema.safeParse(toObject([["limit", "0"]])).success,
    ).toBe(false);
  });

  it("rejects invalid date filters", () => {
    expect(
      marketPricesQuerySchema.safeParse(
        toObject([
          ["from", "not-a-date"],
        ]),
      ).success,
    ).toBe(false);
  });
});
