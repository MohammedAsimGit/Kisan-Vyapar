import "server-only";
import {
  getMarketCostConfig,
  getMarketDataConfig,
  isMarketDataSourceConfigured,
} from "@/config/env";
import {
  isMarketDataFresh,
  MARKET_DATA_SOURCE_LABEL,
} from "./config";
import {
  getMarketPricesForScope,
  persistMarketObservations,
} from "./market-repository";
import { normalizeMarketObservation } from "./normalizer";
import { fetchDataGovResource } from "./data-gov-client";
import { cropIdForCommodity } from "./crop-commodities";
import {
  expectedNetPrice,
  hasCostConfig,
  type MarketCostConfig,
} from "./net-price";
import type { MarketPricesResult, MarketScope } from "./types";

const DEFAULT_UNIT = "quintal";
const SOURCE_LABEL = "data.gov.in";

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

function attachNetPrice(
  records: MarketPricesResult["records"],
  costs: MarketCostConfig,
): MarketPricesResult["records"] {
  if (!hasCostConfig(costs)) {
    return records;
  }
  return records.map((record) => ({
    ...record,
    expectedNetPrice: expectedNetPrice(record.modalPrice, costs),
  }));
}

function matchesText(value: string | undefined, term: string | undefined): boolean {
  if (!term) {
    return true;
  }
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes(term.trim().toLowerCase());
}

async function refreshFromProvider(scope: MarketScope): Promise<number> {
  const config = getMarketDataConfig();
  const rawRecords = await fetchDataGovResource(config, {
    commodity: scope.commodity,
    state: scope.state,
    district: scope.district,
    market: scope.market,
  });

  let normalized = 0;
  let rejected = 0;
  const observations = [];

  for (const raw of rawRecords) {
    const result = normalizeMarketObservation(raw, {
      defaultUnit: DEFAULT_UNIT,
      source: SOURCE_LABEL,
    });

    if (!result.ok) {
      rejected += 1;
      continue;
    }

    const observation = result.value;

    // Local filtering until the OGD field names are verified for server-side
    // filters.
    if (!matchesText(observation.commodity, scope.commodity)) {
      continue;
    }
    if (!matchesText(observation.state, scope.state)) {
      continue;
    }
    if (!matchesText(observation.district, scope.district)) {
      continue;
    }
    if (!matchesText(observation.market, scope.market)) {
      continue;
    }

    const inferredCrop = cropIdForCommodity(observation.commodity);
    if (scope.crop && inferredCrop && inferredCrop !== scope.crop) {
      continue;
    }
    observation.crop = inferredCrop;

    observations.push(observation);
    normalized += 1;
  }

  console.info("[market] provider refresh", {
    provider: "data.gov.in",
    received: rawRecords.length,
    normalized,
    rejected,
  });

  if (normalized > 0) {
    await persistMarketObservations(observations);
  }

  return normalized;
}

export async function getMarketPrices(
  scope: MarketScope,
): Promise<MarketPricesResult> {
  let { records, newestFetchedAt } = await getMarketPricesForScope(scope);

  const label = scopeLabel(scope);
  const costs = getMarketCostConfig();

  const shouldRefresh =
    isMarketDataSourceConfigured() &&
    (records.length === 0 || !isMarketDataFresh(newestFetchedAt));

  if (shouldRefresh) {
    try {
      const normalizedCount = await refreshFromProvider(scope);
      const refreshed = await getMarketPricesForScope(scope);
      records = refreshed.records;
      newestFetchedAt = refreshed.newestFetchedAt;
      if (normalizedCount === 0 && records.length > 0) {
        newestFetchedAt = null;
      }
    } catch (error) {
      console.info("[market] provider refresh failed", {
        provider: "data.gov.in",
        message: error instanceof Error ? error.message : "unknown error",
      });
      // Fall through to cached data (stale) or unavailable.
    }
  }

  if (records.length === 0) {
    const configured = isMarketDataSourceConfigured();
    return {
      availability: configured ? "unavailable" : "unconfigured",
      records: [],
      meta: {
        count: 0,
        scopeLabel: label,
        message: configured
          ? "Market prices currently unavailable. Please try again later."
          : "Market price data has not been configured for this deployment yet. Prices are never invented.",
      },
    };
  }

  const fresh = isMarketDataFresh(newestFetchedAt);
  return {
    availability: fresh ? "fresh" : "stale",
    records: attachNetPrice(records, costs),
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
