import { scoreBand } from "@/features/matching/config";
import {
  matchCompatibility,
  scoreListingAgainstRequirement,
} from "@/features/matching/engine";
import type { ListingSnapshot, RequirementSnapshot } from "@/features/matching/types";
import type { MatchView } from "@/features/matching/views";
import type { OfferView } from "./types";

/**
 * Recomputes the deterministic Sprint 5 match score for the produce ↔
 * requirement pair behind an offer. Same engine, same inputs as the match
 * pages, so the score is identical — informational only, never recalculated
 * differently inside a negotiation.
 */
export function matchViewForOffer(offer: OfferView): MatchView {
  const listing: ListingSnapshot = {
    id: offer.produce.id,
    crop: offer.produce.crop,
    variety: offer.produce.variety,
    quality: offer.produce.quality,
    quantity: offer.produce.quantity,
    unit: offer.produce.unit,
    askingPricePerUnit: offer.produce.askingPricePerUnit,
    currency: "INR",
    location: {
      geo: offer.produce.location.geo ?? undefined,
      district: offer.produce.location.district,
      state: offer.produce.location.state,
    },
    expectedHarvestDate: offer.produce.expectedHarvestDate,
  };

  const requirement: RequirementSnapshot = {
    id: offer.requirement.id,
    crop: offer.requirement.crop,
    quality: offer.requirement.quality,
    quantity: offer.requirement.quantity,
    unit: offer.requirement.unit,
    targetPriceMinPerUnit: offer.requirement.targetPriceMin,
    targetPriceMaxPerUnit: offer.requirement.targetPriceMax,
    currency: "INR",
    location: {
      geo: offer.requirement.location.geo ?? undefined,
      district: offer.requirement.location.district,
      state: offer.requirement.location.state,
    },
    requiredBy: offer.requirement.requiredBy,
  };

  const detail = scoreListingAgainstRequirement(listing, requirement);
  return {
    score: detail.score,
    band: scoreBand(detail.score),
    factors: detail.factors.map((factor) => ({
      key: factor.key,
      label: factor.label,
      score: factor.score,
      detail: factor.detail,
    })),
    reasons: detail.reasons,
    flags: matchCompatibility(detail),
  };
}