export const PRICING_CONFIG = {
  // Only observations within this many days of the latest arrival are used.
  OBSERVATION_WINDOW_DAYS: 7,
  // Minimum observations to emit any suggestion.
  MIN_OBSERVATIONS_FOR_SUGGESTION: 1,
  // Minimum observations for "high"/"medium" confidence.
  MIN_OBSERVATIONS_FOR_CONFIDENCE: 5,
  // Minimum distinct observation days required to compute a trend.
  MIN_TREND_DAYS: 2,
  // Padding used around the median to derive the suggested range.
  RANGE_PADDING_FRACTION: 0.05,
  // Volatility (coefficient of variation) thresholds.
  VOLATILITY_LOW_THRESHOLD: 0.1,
  VOLATILITY_HIGH_THRESHOLD: 0.25,
  // Stale threshold in ms (shared with market cache semantics).
  FRESH_TTL_MS: 6 * 60 * 60 * 1000,
  // Sprint 4 keeps the quality effect neutral (no reliable empirical basis).
  QUALITY_ADJUSTMENT_FRACTION: 0,
} as const;

export type TrendDirection = "rising" | "falling" | "stable" | "insufficient_data";
export type ConfidenceLevel = "high" | "medium" | "low" | "limited" | "insufficient";
export type VolatilityLevel = "low" | "moderate" | "high";

export interface ObservationInput {
  market: string;
  modalPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  arrivalDate?: string;
  fetchedAt: string;
}

export interface TrendResult {
  direction: TrendDirection;
  percentageChange?: number;
}

export interface PricingResult {
  hasSuggestion: boolean;
  suggestedPrice?: number;
  suggestedMinPrice?: number;
  suggestedMaxPrice?: number;
  trend: TrendResult;
  volatility: VolatilityLevel;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  observationCount: number;
  distinctMarkets: number;
  distinctDays: number;
  latestModalPrice?: number;
  observedRange?: { min?: number; max?: number };
  freshness: "fresh" | "stale" | "unknown";
  reason: string;
  factors: string[];
  series: Array<{ day: string; value: number }>;
}
