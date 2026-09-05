import { getCropById } from "@/constants/crops";
import { QUALITY_GRADES } from "@/constants/quality-grades";
import { getQualityGradeLabel } from "@/constants/quality-grades";
import {
  AVAILABILITY_SCORING,
  DISTANCE_SCORING,
  FACTOR_LABELS,
  MATCHING_THRESHOLDS,
  MATCHING_WEIGHTS,
  PRICE_SCORING,
  QUALITY_SCORE_MATRIX,
  QUINTAL_CONVERSION,
  RELIABILITY_SCORING_ENABLED,
  type ScoredFactorKey,
} from "./config";
import type {
  FactorScore,
  ListingSnapshot,
  MatchCompatibility,
  MatchDetail,
  MatchReason,
  RequirementSnapshot,
} from "./types";

const { A, B, C, UNGRADED } = QUALITY_GRADES;

interface FactorOutcome {
  score: number | null;
  detail?: string;
  reason?: MatchReason;
  distanceKm?: number;
}

function cropLabel(cropId: string): string {
  return getCropById(cropId)?.name ?? cropId;
}

function unitLabel(unit: string): string {
  if (unit === "kg") return "Kg";
  if (unit === "tonne") return "Tonne";
  return "Quintal";
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Day-key at UTC so date-only comparisons never drift across timezones. */
function dayKey(value: string | Date | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00Z`).getTime();
  const to = new Date(`${toKey}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86_400_000);
}

function toQuintalQuantity(quantity: number, unit: string): number {
  return quantity * (QUINTAL_CONVERSION[unit] ?? 1);
}

function toPricePerQuintal(pricePerUnit: number, unit: string): number {
  return pricePerUnit * (QUINTAL_CONVERSION[unit] ?? 1);
}

/** Great-circle distance in km between two coordinates. */
export function estimateDistanceKm(
  from: { coordinates: [number, number] },
  to: { coordinates: [number, number] },
): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;
  const [lon1, lat1] = from.coordinates;
  const [lon2, lat2] = to.coordinates;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c);
}

function cropOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  if (listing.crop !== requirement.crop) {
    return {
      score: 0,
      reason: {
        tone: "limitation",
        text: `The crops are different (${cropLabel(requirement.crop)} required vs ${cropLabel(listing.crop)} offered), so this is not a match.`,
      },
    };
  }
  return {
    score: 100,
    reason: { tone: "positive", text: `Same crop: ${cropLabel(listing.crop)}.` },
  };
}

function qualityOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  const offered = listing.quality ?? UNGRADED;
  const required = requirement.quality ?? UNGRADED;
  const score = QUALITY_SCORE_MATRIX[required]?.[offered] ?? 60;

  let detail: string;
  let reason: MatchReason;
  if (offered === required) {
    detail = `Required ${getQualityGradeLabel(required)} matches offered ${getQualityGradeLabel(offered)}.`;
    reason = { tone: "positive", text: `Grade matches exactly (${getQualityGradeLabel(required)}).` };
  } else if (required === UNGRADED) {
    detail = "No grade was required; any graded produce is acceptable.";
    reason = {
      tone: "positive",
      text: "No specific grade was required, so graded produce is acceptable.",
    };
  } else if (offered === UNGRADED) {
    detail = `Offered produce is ungraded while ${getQualityGradeLabel(required)} was required.`;
    reason = {
      tone: "neutral",
      text: "The listing grade is ungraded, so quality fit is uncertain.",
    };
  } else if (gradeRank(offered) > gradeRank(required)) {
    detail = `Offered ${getQualityGradeLabel(offered)} is better than required ${getQualityGradeLabel(required)}.`;
    reason = {
      tone: "positive",
      text: `Offered grade (${getQualityGradeLabel(offered)}) is higher than required (${getQualityGradeLabel(required)}).`,
    };
  } else {
    detail = `Offered ${getQualityGradeLabel(offered)} is lower than required ${getQualityGradeLabel(required)}.`;
    reason = {
      tone: "limitation",
      text: `Offered grade (${getQualityGradeLabel(offered)}) is lower than the required grade (${getQualityGradeLabel(required)}).`,
    };
  }

  return { score, detail, reason };
}

function gradeRank(grade: string): number {
  if (grade === A) return 3;
  if (grade === B) return 2;
  if (grade === C) return 1;
  return 0;
}

function quantityOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  const offered = toQuintalQuantity(listing.quantity, listing.unit);
  const required = toQuintalQuantity(requirement.quantity, requirement.unit);
  if (required <= 0) {
    return { score: null, reason: { tone: "neutral", text: "Required quantity is unknown." } };
  }

  const ratio = Math.min(1, offered / required);
  const score = Math.round(ratio * 100);

  if (ratio >= 1) {
    return {
      score,
      detail: `Offers ${offered} quintal(s) of the ${required} quintal(s) required.`,
      reason: {
        tone: "positive",
        text: `The listing fully covers the required quantity (${formatQuantity(offered)} of ${formatQuantity(required)}).`,
      },
    };
  }

  return {
    score,
    detail: `Offers ${offered} quintal(s) of the ${required} quintal(s) required.`,
    reason: {
      tone: "limitation",
      text: `Partial supply: the listing offers ${formatQuantity(offered)} of the ${formatQuantity(required)} required.`,
    },
  };
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function priceOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  const listingPrice = listing.askingPricePerUnit;
  const min = requirement.targetPriceMinPerUnit;
  const max = requirement.targetPriceMaxPerUnit;

  if (listingPrice === undefined || listingPrice === null) {
    return {
      score: null,
      reason: {
        tone: "neutral",
        text: "No asking price is set, so price fit was not scored.",
      },
    };
  }
  if (min === undefined || max === undefined) {
    return {
      score: null,
      reason: {
        tone: "neutral",
        text: "No target price range is available, so price fit was not scored.",
      },
    };
  }

  const price = toPricePerQuintal(listingPrice, listing.unit);
  const priceMin = toPricePerQuintal(min, requirement.unit);
  const priceMax = toPricePerQuintal(max, requirement.unit);

  if (price <= priceMax && price >= priceMin) {
    return {
      score: 100,
      detail: `Asking price ${formatInr(price)} is inside the target range ${formatInr(priceMin)}–${formatInr(priceMax)}.`,
      reason: {
        tone: "positive",
        text: `The asking price (${formatInr(price)}) fits inside the target range (${formatInr(priceMin)}–${formatInr(priceMax)}).`,
      },
    };
  }

  if (price < priceMin) {
    const score = PRICE_SCORING.BELOW_MIN_SCORE;
    return {
      score,
      detail: `Asking price ${formatInr(price)} is below the target minimum of ${formatInr(priceMin)}.`,
      reason: {
        tone: "neutral",
        text: `The asking price (${formatInr(price)}) is below the target minimum (${formatInr(priceMin)}) — cheaper than expected.`,
      },
    };
  }

  const overMultiple = (price - priceMax) / priceMax;
  const score = Math.max(
    0,
    Math.round(100 - overMultiple * PRICE_SCORING.OVER_MAX_PENALTY_PER_MULTIPLE),
  );
  return {
    score,
    detail: `Asking price ${formatInr(price)} is above the target maximum of ${formatInr(priceMax)}.`,
    reason: {
      tone: "limitation",
      text: `The asking price (${formatInr(price)}) is above the target maximum (${formatInr(priceMax)}).`,
    },
  };
}

function distanceOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  const listingGeo = listing.location?.geo;
  const requirementGeo = requirement.location?.geo;

  if (
    listingGeo &&
    listingGeo.coordinates &&
    requirementGeo &&
    requirementGeo.coordinates
  ) {
    const distanceKm = estimateDistanceKm(
      { coordinates: listingGeo.coordinates },
      { coordinates: requirementGeo.coordinates },
    );
    const score = Math.max(
      0,
      Math.round(100 - distanceKm * DISTANCE_SCORING.SCORE_DECAY_PER_KM),
    );
    const reason = {
      tone: score >= MATCHING_THRESHOLDS.COMPATIBLE_SCORE ? "positive" : "neutral",
      text: `Estimated straight-line distance is about ${distanceKm} km.`,
    } as MatchReason;
    return {
      score,
      distanceKm,
      detail: `Straight-line distance ≈ ${distanceKm} km.`,
      reason,
    };
  }

  // No coordinates: never fabricate a distance. Fall back to honest text-region
  // proximity when both sides give the same region.
  const listingState = listing.location?.state;
  const requirementState = requirement.location?.state;
  const listingDistrict = listing.location?.district;
  const requirementDistrict = requirement.location?.district;

  if (listingState && requirementState) {
    if (
      listingState.trim().toLowerCase() === requirementState.trim().toLowerCase()
    ) {
      const sameDistrict =
        listingDistrict &&
        requirementDistrict &&
        listingDistrict.trim().toLowerCase() ===
          requirementDistrict.trim().toLowerCase();
      const score = sameDistrict
        ? DISTANCE_SCORING.SAME_DISTRICT_SCORE
        : DISTANCE_SCORING.SAME_STATE_SCORE;
      return {
        score,
        detail: sameDistrict
          ? `Both sides are in ${listingDistrict}, ${listingState}.`
          : `Both sides are in ${listingState}.`,
        reason: {
          tone: "positive",
          text: sameDistrict
            ? `Both sides are in the same district (${listingDistrict}, ${listingState}).`
            : `Both sides are in the same state (${listingState}).`,
        },
      };
    }
    return {
      score: null,
      reason: {
        tone: "neutral",
        text: "Locations are in different states and no coordinates are available, so distance was not scored.",
      },
    };
  }

  return {
    score: null,
    reason: {
      tone: "neutral",
      text: "Location coordinates are not available, so distance was not scored.",
    },
  };
}

function availabilityOutcome(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): FactorOutcome {
  const harvestKey = dayKey(listing.expectedHarvestDate);
  const requiredByKey = dayKey(requirement.requiredBy);

  if (!harvestKey || !requiredByKey) {
    return {
      score: null,
      reason: {
        tone: "neutral",
        text: "Availability dates are not available to compare.",
      },
    };
  }

  const slackDays = daysBetween(harvestKey, requiredByKey);
  if (slackDays < 0) {
    return {
      score: AVAILABILITY_SCORING.LATE_SCORE,
      detail: `Produce is ready after the required-by date (${requiredByKey}).`,
      reason: {
        tone: "limitation",
        text: `Produce is ready (${harvestKey}) after the required-by date (${requiredByKey}).`,
      },
    };
  }

  const score =
    slackDays >= AVAILABILITY_SCORING.PERFECT_SLACK_DAYS
      ? 100
      : slackDays >= AVAILABILITY_SCORING.GOOD_SLACK_DAYS
        ? AVAILABILITY_SCORING.GOOD_SLACK_SCORE
        : AVAILABILITY_SCORING.TIGHT_SLACK_SCORE;

  const tone = score >= AVAILABILITY_SCORING.GOOD_SLACK_SCORE ? "positive" : "neutral";
  return {
    score,
    detail: `Produce is ready on ${harvestKey}; required by ${requiredByKey} (${slackDays} day(s) of slack).`,
    reason: {
      tone,
      text:
        score >= AVAILABILITY_SCORING.GOOD_SLACK_SCORE
          ? `Produce ready on ${harvestKey} comfortably meets the ${requiredByKey} required-by date.`
          : `Produce ready on ${harvestKey} is close to the ${requiredByKey} required-by date.`,
    },
  };
}

const WEIGHT_BY_FACTOR: Record<ScoredFactorKey, number> = {
  crop: MATCHING_WEIGHTS.cropCompatibility,
  quality: MATCHING_WEIGHTS.qualityFit,
  quantity: MATCHING_WEIGHTS.quantityFit,
  price: MATCHING_WEIGHTS.priceFit,
  distance: MATCHING_WEIGHTS.distanceFit,
  availability: MATCHING_WEIGHTS.availabilityFit,
};

const outcomeBuilders: Record<
  ScoredFactorKey,
  (listing: ListingSnapshot, requirement: RequirementSnapshot) => FactorOutcome
> = {
  crop: cropOutcome,
  quality: qualityOutcome,
  quantity: quantityOutcome,
  price: priceOutcome,
  distance: distanceOutcome,
  availability: availabilityOutcome,
};

/**
 * Deterministic, explainable matching of one published produce listing against
 * one active buying requirement. Pure: same inputs always produce the same
 * score. Never consults an LLM or any other non-deterministic source.
 */
export function scoreListingAgainstRequirement(
  listing: ListingSnapshot,
  requirement: RequirementSnapshot,
): MatchDetail {
  const factors: FactorScore[] = [];
  const reasons: MatchReason[] = [];
  let distanceKm: number | undefined;

  for (const key of Object.keys(outcomeBuilders) as ScoredFactorKey[]) {
    const outcome = outcomeBuilders[key](listing, requirement);
    if (outcome.distanceKm !== undefined) {
      distanceKm = outcome.distanceKm;
    }
    if (outcome.reason) {
      reasons.push(outcome.reason);
    }
    factors.push({
      key,
      label: FACTOR_LABELS[key],
      score: outcome.score,
      detail: outcome.detail,
    });
  }

  // Crop mismatch is a hard veto — a requirement for onions never matches tomato.
  const cropFactor = factors.find((factor) => factor.key === "crop");
  if (cropFactor?.score === 0) {
    return { score: 0, factors, reasons, distanceKm };
  }

  let weightedSum = 0;
  let weightSum = 0;
  for (const factor of factors) {
    if (factor.score !== null) {
      weightedSum += (WEIGHT_BY_FACTOR[factor.key] ?? 0) * factor.score;
      weightSum += WEIGHT_BY_FACTOR[factor.key] ?? 0;
    }
  }

  // Reliability is intentionally excluded until real buyer history exists.
  if (RELIABILITY_SCORING_ENABLED) {
    // Reserved: factor.reliability would be scored here.
  }

  const score = weightSum > 0 ? Math.round(weightedSum / weightSum) : 0;

  return { score, factors, reasons, distanceKm };
}

/** Filter-friendly flags derived from the factor scores (never invented). */
export function matchCompatibility(match: MatchDetail): MatchCompatibility {
  const byKey = new Map(match.factors.map((factor) => [factor.key, factor]));
  const scoreAt = (key: ScoredFactorKey): number | null =>
    byKey.get(key)?.score ?? null;

  const compatible = (score: number | null): boolean =>
    score !== null && score >= MATCHING_THRESHOLDS.COMPATIBLE_SCORE;

  return {
    strong: match.score >= MATCHING_THRESHOLDS.STRONG_SCORE,
    priceCompatible: compatible(scoreAt("price")),
    qualityCompatible: compatible(scoreAt("quality")),
    quantityCompatible: compatible(scoreAt("quantity")),
    nearby: compatible(scoreAt("distance")),
  };
}
