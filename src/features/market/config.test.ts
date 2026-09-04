import { describe, expect, it } from "vitest";
import { isMarketDataFresh, MARKET_PRICE_CACHE_TTL_MS } from "./config";

describe("market cache freshness", () => {
  it("treats a missing fetch time as stale", () => {
    expect(isMarketDataFresh(null)).toBe(false);
    expect(isMarketDataFresh(undefined)).toBe(false);
  });

  it("treats recently fetched data as fresh", () => {
    const now = Date.now();
    expect(isMarketDataFresh(new Date(now - 1000), now)).toBe(true);
  });

  it("treats data older than the TTL as stale", () => {
    const now = Date.now();
    expect(
      isMarketDataFresh(new Date(now - MARKET_PRICE_CACHE_TTL_MS - 1000), now),
    ).toBe(false);
  });
});
