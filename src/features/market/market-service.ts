import "server-only";
import { isMarketDataSourceConfigured } from "@/config/env";
import {
  isMarketDataFresh,
  MARKET_DATA_SOURCE_LABEL,
} from "./config";
import { getMarketPricesForScope } from "./market-repository";
import type { MarketPricesResult, MarketScope } from "./types";

function scopeLabel(scope: MarketScope): string | undefined {
  const parts: string[] = [];
  if (scope.district) {
    parts.push(scope.district);
  }
  if (scope.state) {
    parts.push(scope.state);
  }
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export async function getMarketPrices(
  scope: MarketScope,
): Promise<MarketPricesResult> {
  const { records, newestFetchedAt } = await getMarketPricesForScope(scope);

  const label = scopeLabel(scope);

  if (records.length === 0) {
    const configured = isMarketDataSourceConfigured();
    return {
      availability: configured ? "unavailable" : "unconfigured",
      records: [],
      meta: {
        count: 0,
        scopeLabel: label,
        message: configured
          ? "Market prices are temporarily unavailable. Please try again later."
          : "Market price data has not been configured for this deployment yet. Prices are never invented.",
      },
    };
  }

  const fresh = isMarketDataFresh(newestFetchedAt);
  return {
    availability: fresh ? "fresh" : "stale",
    records,
    meta: {
      count: records.length,
      scopeLabel: label,
      lastUpdated: newestFetchedAt
        ? newestFetchedAt.toISOString()
        : undefined,
      source: MARKET_DATA_SOURCE_LABEL,
      message: fresh
        ? undefined
        : "Showing the latest available market data. Live update is temporarily unavailable.",
    },
  };
}
