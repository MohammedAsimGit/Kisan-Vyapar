import {
  PRICING_CONFIG,
  type ConfidenceLevel,
  type ObservationInput,
  type PricingResult,
  type TrendDirection,
  type TrendResult,
  type VolatilityLevel,
} from "./config";

const { RANGE_PADDING_FRACTION, FRESH_TTL_MS } = PRICING_CONFIG;

type PricePoint = ObservationInput & { modalPrice: number };

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function toMs(iso?: string): number | undefined {
  if (!iso) {
    return undefined;
  }
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median of empty set");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(values: number[], mean: number): number {
  if (values.length < 2) {
    return 0;
  }
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function latestPerMarket(rows: ObservationInput[]): PricePoint[] {
  const byMarket = new Map<string, PricePoint>();
  for (const row of rows) {
    if (typeof row.modalPrice !== "number" || row.modalPrice <= 0) {
      continue;
    }
    const existing = byMarket.get(row.market);
    const rowArrival = toMs(row.arrivalDate) ?? 0;
    const existingArrival = existing ? toMs(existing.arrivalDate) ?? 0 : -1;
    if (
      !existing ||
      rowArrival > existingArrival ||
      (rowArrival === existingArrival &&
        toMs(row.fetchedAt)! > (toMs(existing.fetchedAt) ?? 0))
    ) {
      byMarket.set(row.market, { ...row, modalPrice: row.modalPrice });
    }
  }
  return Array.from(byMarket.values());
}

function dailyMedians(rows: ObservationInput[]): Array<{ day: string; value: number }> {
  const byDay = new Map<string, number[]>();
  for (const row of rows) {
    if (!row.arrivalDate || typeof row.modalPrice !== "number" || row.modalPrice <= 0) {
      continue;
    }
    const day = dayKey(row.arrivalDate);
    const values = byDay.get(day) ?? [];
    values.push(row.modalPrice);
    byDay.set(day, values);
  }
  return Array.from(byDay.entries())
    .map(([day, values]) => ({ day, value: median(values) }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

export function buildPriceSeries(
  rows: ObservationInput[],
): Array<{ day: string; value: number }> {
  return dailyMedians(rows);
}

function computeTrend(days: Array<{ day: string; value: number }>): TrendResult {
  if (days.length < PRICING_CONFIG.MIN_TREND_DAYS) {
    return { direction: "insufficient_data" };
  }
  const first = days[0].value;
  const last = days[days.length - 1].value;
  if (first <= 0) {
    return { direction: "insufficient_data" };
  }
  const percentageChange = ((last - first) / first) * 100;
  if (percentageChange >= 1) {
    return { direction: "rising", percentageChange };
  }
  if (percentageChange <= -1) {
    return { direction: "falling", percentageChange };
  }
  return { direction: "stable", percentageChange };
}

function volatilityLevel(cv: number): VolatilityLevel {
  if (cv < PRICING_CONFIG.VOLATILITY_LOW_THRESHOLD) {
    return "low";
  }
  if (cv <= PRICING_CONFIG.VOLATILITY_HIGH_THRESHOLD) {
    return "moderate";
  }
  return "high";
}

function confidence(
  count: number,
  trend: TrendResult,
  volatility: VolatilityLevel,
  freshness: PricingResult["freshness"],
): { level: ConfidenceLevel; score: number } {
  if (count < PRICING_CONFIG.MIN_OBSERVATIONS_FOR_SUGGESTION) {
    return { level: "insufficient", score: 0 };
  }
  if (count === 1) {
    return { level: "limited", score: 0.2 };
  }
  const countPart = Math.min(0.5, (count / PRICING_CONFIG.MIN_OBSERVATIONS_FOR_CONFIDENCE) * 0.5);
  const freshnessPart = freshness === "fresh" ? 0.3 : freshness === "stale" ? 0.1 : 0.15;
  const volatilityPart =
    volatility === "low" ? 0.2 : volatility === "moderate" ? 0.12 : 0.05;
  const score = Math.min(1, countPart + freshnessPart + volatilityPart);

  let level: ConfidenceLevel;
  if (score >= 0.75) {
    level = "high";
  } else if (score >= 0.55) {
    level = "medium";
  } else if (score >= 0.35) {
    level = "low";
  } else {
    level = "limited";
  }
  return { level, score };
}

function freshnessOf(lastFetchedAt: string | undefined, now: number): PricingResult["freshness"] {
  if (!lastFetchedAt) {
    return "unknown";
  }
  const fetched = new Date(lastFetchedAt).getTime();
  if (Number.isNaN(fetched)) {
    return "unknown";
  }
  return now - fetched <= FRESH_TTL_MS ? "fresh" : "stale";
}

export function generatePricingGuidance(
  rows: ObservationInput[],
  options?: { now?: number },
): PricingResult {
  const now = options?.now ?? Date.now();

  const validRows = rows.filter((row) => row.market.trim() !== "");
  if (validRows.length === 0) {
    return {
      hasSuggestion: false,
      trend: { direction: "insufficient_data" },
      volatility: "low",
      confidence: "insufficient",
      confidenceScore: 0,
      observationCount: 0,
      distinctMarkets: 0,
      distinctDays: 0,
      freshness: "unknown", factors: [], series: [], reason: "No market observations are available.",
    };
  }

  const latest = latestPerMarket(validRows);
  const values = latest.map((row) => row.modalPrice);

  if (values.length === 0) {
    return {
      hasSuggestion: false,
      trend: { direction: "insufficient_data" },
      volatility: "low",
      confidence: "insufficient",
      confidenceScore: 0,
      observationCount: validRows.length,
      distinctMarkets: 0,
      distinctDays: 0,
      freshness: "unknown", factors: [], series: [], reason: "Market observations do not contain a modal price.",
    };
  }

  const distinctMarkets = latest.length;
  const daily = dailyMedians(validRows);
  const distinctDays = daily.length;
  const trend = computeTrend(daily);
  const observedMin = Math.min(...values);
  const observedMax = Math.max(...values);
  const baseline = median(values);
  const deviation = standardDeviation(values, baseline);
  const cv = baseline > 0 ? deviation / baseline : 0;
  const volatility = volatilityLevel(cv);

  let lastFetched: string | undefined;
  for (const row of latest) {
    const rowTime = toMs(row.fetchedAt);
    if (rowTime !== undefined && (!lastFetched || rowTime > (toMs(lastFetched) ?? 0))) {
      lastFetched = row.fetchedAt;
    }
  }
  const freshness = freshnessOf(lastFetched, now);

  const { level, score } = confidence(
    values.length,
    trend,
    volatility,
    freshness,
  );

  const padding = baseline * RANGE_PADDING_FRACTION;
  const suggestedMinPrice = clampRound(baseline - padding, observedMin, observedMax);
  const suggestedMaxPrice = clampRound(baseline + padding, observedMin, observedMax);
  const suggestedPrice = Math.round(baseline);

  const factors: string[] = [];
  if (trend.percentageChange !== undefined) {
    factors.push(
      trend.direction === "rising"
        ? `Prices rose about ${Math.abs(trend.percentageChange).toFixed(1)}% over the recent observation period.`
        : trend.direction === "falling"
          ? `Prices fell about ${Math.abs(trend.percentageChange).toFixed(1)}% over the recent observation period.`
          : "Prices were broadly stable over the recent observation period.",
    );
  }
  factors.push(`Based on ${values.length} real market observations across ${distinctMarkets} market${distinctMarkets === 1 ? "" : "s"}.`);
  factors.push(
    volatility === "low"
      ? "Price volatility is low."
      : volatility === "moderate"
        ? "Price volatility is moderate."
        : "Price volatility is high.",
  );
  factors.push(
    freshness === "fresh"
      ? "Data was fetched recently."
      : freshness === "stale"
        ? "Data may be outdated."
        : "Data freshness is unknown.",
  );

  return {
    hasSuggestion: values.length >= PRICING_CONFIG.MIN_OBSERVATIONS_FOR_SUGGESTION,
    suggestedPrice,
    suggestedMinPrice,
    suggestedMaxPrice,
    trend,
    volatility,
    confidence: level,
    confidenceScore: Math.round(score * 100) / 100,
    observationCount: values.length,
    distinctMarkets,
    distinctDays,
    latestModalPrice: Math.round(baseline),
    observedRange: { min: observedMin, max: observedMax },
    freshness,
    reason: factors.join(" "),
    factors,
    series: daily,
  };
}

function clampRound(value: number, min: number, max: number): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

export type { ConfidenceLevel, TrendDirection, TrendResult, VolatilityLevel };
