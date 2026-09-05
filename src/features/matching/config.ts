import { QUALITY_GRADES, type QualityGrade } from "@/constants/quality-grades";

/**
 * Centralised matching configuration. All tunable knobs of the deterministic
 * scoring engine live here — never scattered across call sites.
 *
 * Weights sum to 1. The engine only ever sums the weights of the factors it
 * could actually score, then normalises by that sum, so a factor with missing
 * data (e.g. no coordinates) never drags a match down for reasons we cannot see.
 */
export const MATCHING_WEIGHTS = {
  cropCompatibility: 0.25,
  qualityFit: 0.2,
  quantityFit: 0.15,
  priceFit: 0.15,
  distanceFit: 0.1,
  availabilityFit: 0.1,
  // Reserved: buyer reliability needs real transaction history (completed
  // orders, fulfilment, payment behaviour). Kisan Vyapar has none yet, so this
  // factor is DISABLED rather than scored from invented data.
  reliability: 0.05,
} as const;

/** Total of configured weights — kept equal to 1 so drift is caught in tests. */
export const MATCHING_WEIGHT_TOTAL = Object.values(MATCHING_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0,
);

/**
 * Reliability stays switched off until real, trustworthy buyer history exists.
 * With it off, matching is scored over crop/quality/quantity/price/location/
 * availability only and the result is renormalised over those factors.
 */
export const RELIABILITY_SCORING_ENABLED = false;

/** Factors the engine can score in Sprint 5 (reliability reserved for later). */
export const SCORED_FACTOR_KEYS = [
  "crop",
  "quality",
  "quantity",
  "price",
  "distance",
  "availability",
] as const;

export type ScoredFactorKey = (typeof SCORED_FACTOR_KEYS)[number];

export const FACTOR_LABELS: Record<ScoredFactorKey, string> = {
  crop: "Crop",
  quality: "Quality",
  quantity: "Quantity",
  price: "Price",
  distance: "Location",
  availability: "Availability",
};

export const MATCHING_THRESHOLDS = {
  /** Matches at/above this score are shown under "Strong matches". */
  STRONG_SCORE: 75,
  /** Factors at/above this score count as "compatible" for filters. */
  COMPATIBLE_SCORE: 75,
} as const;

export const SCORE_BANDS = {
  STRONG: "strong",
  GOOD: "good",
  FAIR: "fair",
  WEAK: "weak",
} as const;

export type ScoreBand = (typeof SCORE_BANDS)[keyof typeof SCORE_BANDS];

export function scoreBand(score: number): ScoreBand {
  if (score >= MATCHING_THRESHOLDS.STRONG_SCORE) {
    return SCORE_BANDS.STRONG;
  }
  if (score >= 60) {
    return SCORE_BANDS.GOOD;
  }
  if (score >= 40) {
    return SCORE_BANDS.FAIR;
  }
  return SCORE_BANDS.WEAK;
}

/** Quantity/price conversion to quintal so mixed units compare correctly. */
export const QUINTAL_CONVERSION: Record<string, number> = {
  kg: 0.01,
  quintal: 1,
  tonne: 10,
};

export const PRICE_SCORING = {
  /** Asking price below the buyer's minimum (cheaper than expected). */
  BELOW_MIN_SCORE: 75,
  /** Points subtracted per full multiple the asking price exceeds the max. */
  OVER_MAX_PENALTY_PER_MULTIPLE: 200,
} as const;

export const DISTANCE_SCORING = {
  /** Deterministic decay of the distance score per straight-line km. */
  SCORE_DECAY_PER_KM: 0.4,
  /** Region proximity used only when both sides share text regions (no coords). */
  SAME_DISTRICT_SCORE: 100,
  SAME_STATE_SCORE: 85,
} as const;

export const AVAILABILITY_SCORING = {
  /** Days of slack (requiredBy − harvest) needed for a perfect score. */
  PERFECT_SLACK_DAYS: 7,
  /** Days of slack needed for a good score. */
  GOOD_SLACK_DAYS: 3,
  GOOD_SLACK_SCORE: 95,
  TIGHT_SLACK_SCORE: 85,
  /** Produce ready after the required date is incompatible. */
  LATE_SCORE: 0,
} as const;

/**
 * Quality compatibility matrix: rows are the quality the requirement asks for,
 * columns the quality the listing offers. Higher offered grade than required is
 * acceptable; a lower grade is a weaker match; "ungraded" produce keeps a modest
 * score because real grade information is missing (never invented).
 */
const { A, B, C, UNGRADED } = QUALITY_GRADES;

export const QUALITY_SCORE_MATRIX: Record<
  QualityGrade,
  Record<QualityGrade, number>
> = {
  [A]: {
    [A]: 100,
    [B]: 50,
    [C]: 25,
    [UNGRADED]: 55,
  },
  [B]: {
    [A]: 95,
    [B]: 100,
    [C]: 40,
    [UNGRADED]: 60,
  },
  [C]: {
    [A]: 85,
    [B]: 90,
    [C]: 100,
    [UNGRADED]: 65,
  },
  [UNGRADED]: {
    [A]: 90,
    [B]: 90,
    [C]: 90,
    [UNGRADED]: 70,
  },
};
