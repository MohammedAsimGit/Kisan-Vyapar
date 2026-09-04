import { describe, expect, it } from "vitest";
import { expectedNetPrice, hasCostConfig } from "./net-price";

describe("expected net price model", () => {
  it("equals modal price when no costs are configured", () => {
    expect(hasCostConfig({})).toBe(false);
    expect(expectedNetPrice(3100, {})).toBe(3100);
  });

  it("subtracts flat transport and other per-quintal costs", () => {
    expect(
      expectedNetPrice(3100, { transportPerQuintal: 200, otherPerQuintal: 50 }),
    ).toBe(2850);
  });

  it("subtracts commission as a percentage of modal price", () => {
    expect(expectedNetPrice(2000, { commissionPercent: 5 })).toBe(1900);
  });

  it("never returns a negative net price", () => {
    expect(
      expectedNetPrice(100, { transportPerQuintal: 500, commissionPercent: 20 }),
    ).toBe(0);
  });
});
