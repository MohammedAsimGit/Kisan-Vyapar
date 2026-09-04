export const MARKET_PRICE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export const MARKET_DATA_SOURCE_LABEL = "Government mandi data (data.gov.in)";

export function isMarketDataFresh(
  lastFetchedAt: Date | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!lastFetchedAt) {
    return false;
  }
  return now - lastFetchedAt.getTime() <= MARKET_PRICE_CACHE_TTL_MS;
}
