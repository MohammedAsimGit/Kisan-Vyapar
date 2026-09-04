import "server-only";
import type { MarketPriceView } from "@/features/market/types";
import { generatePricingGuidance } from "./engine";

export interface PriceGuidanceDto {
  hasSuggestion: boolean;
  suggestedPrice?: number;
  suggestedMinPrice?: number;
  suggestedMaxPrice?: number;
  currency: string;
  unit: string;
  latestModalPrice?: number;
  observedRange?: { min?: number; max?: number };
  suggestedRange?: { min?: number; max?: number };
  trend: "rising" | "falling" | "stable" | "insufficient_data";
  trendPercentage?: number;
  confidence: string;
  observationCount: number;
  distinctMarkets: number;
  dataFrom?: string;
  dataTo?: string;
  lastUpdated?: string;
  freshness: string;
  factors: string[];
  series: Array<{ day: string; value: number }>;
}

function toMs(iso?: string): number | undefined {
  if (!iso) {
    return undefined;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

export function buildPriceGuidanceDto(
  records: MarketPriceView[],
): PriceGuidanceDto {
  const guidance = generatePricingGuidance(records);

  const arrivalTimes = records
    .map((record) => record.arrivalDate)
    .filter((date): date is string => Boolean(date))
    .map((date) => toMs(date))
    .filter((ms): ms is number => ms !== undefined)
    .sort((a, b) => a - b);

  const fetchedTimes = records
    .map((record) => toMs(record.fetchedAt))
    .filter((ms): ms is number => ms !== undefined)
    .sort((a, b) => a - b);

  const lastUpdated = fetchedTimes.length
    ? new Date(fetchedTimes[fetchedTimes.length - 1]).toISOString()
    : undefined;

  return {
    hasSuggestion: guidance.hasSuggestion,
    suggestedPrice: guidance.suggestedPrice,
    suggestedMinPrice: guidance.suggestedMinPrice,
    suggestedMaxPrice: guidance.suggestedMaxPrice,
    currency: records[0]?.currency ?? "INR",
    unit: records[0]?.unit ?? "quintal",
    latestModalPrice: guidance.latestModalPrice,
    observedRange: guidance.observedRange,
    suggestedRange:
      guidance.suggestedMinPrice !== undefined &&
      guidance.suggestedMaxPrice !== undefined
        ? { min: guidance.suggestedMinPrice, max: guidance.suggestedMaxPrice }
        : undefined,
    trend: guidance.trend.direction,
    trendPercentage: guidance.trend.percentageChange,
    confidence: guidance.confidence,
    observationCount: guidance.observationCount,
    distinctMarkets: guidance.distinctMarkets,
    dataFrom: arrivalTimes.length
      ? new Date(arrivalTimes[0]).toISOString()
      : undefined,
    dataTo: arrivalTimes.length
      ? new Date(arrivalTimes[arrivalTimes.length - 1]).toISOString()
      : undefined,
    lastUpdated,
    freshness: guidance.freshness,
    factors: guidance.factors,
    series: guidance.series,
  };
}
