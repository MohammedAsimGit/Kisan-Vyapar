import { describe, expect, it } from "vitest";
import {
  estimateDistanceKm,
  matchCompatibility,
  scoreListingAgainstRequirement,
} from "./engine";
import {
  MATCHING_WEIGHTS,
  MATCHING_WEIGHT_TOTAL,
  RELIABILITY_SCORING_ENABLED,
} from "./config";
import type {
  ListingSnapshot,
  RequirementSnapshot,
} from "./types";

const listing: ListingSnapshot = {
  id: "listing-1",
  crop: "tomato",
  quality: "a",
  quantity: 20,
  unit: "quintal",
  askingPricePerUnit: 2750,
  currency: "INR",
  location: { district: "Nashik", state: "Maharashtra" },
  expectedHarvestDate: "2026-09-07",
};

const requirement: RequirementSnapshot = {
  id: "requirement-1",
  crop: "tomato",
  quality: "a",
  quantity: 50,
  unit: "quintal",
  targetPriceMinPerUnit: 2600,
  targetPriceMaxPerUnit: 2800,
  currency: "INR",
  location: { district: "Nashik", state: "Maharashtra" },
  requiredBy: "2026-09-14",
};

describe("matching weights configuration", () => {
  it("centralises weights that total 100%", () => {
    expect(MATCHING_WEIGHT_TOTAL).toBeCloseTo(1, 5);
    expect(MATCHING_WEIGHTS.cropCompatibility).toBe(0.25);
    expect(MATCHING_WEIGHTS.qualityFit).toBe(0.2);
    expect(MATCHING_WEIGHTS.quantityFit).toBe(0.15);
    expect(MATCHING_WEIGHTS.priceFit).toBe(0.15);
    expect(MATCHING_WEIGHTS.distanceFit).toBe(0.1);
    expect(MATCHING_WEIGHTS.availabilityFit).toBe(0.1);
    expect(MATCHING_WEIGHTS.reliability).toBe(0.05);
  });

  it("keeps reliability disabled until real buyer history exists", () => {
    expect(RELIABILITY_SCORING_ENABLED).toBe(false);
  });
});

describe("scoreListingAgainstRequirement", () => {
  it("scores the documented example deterministically", () => {
    const first = scoreListingAgainstRequirement(listing, requirement);
    const second = scoreListingAgainstRequirement(listing, requirement);

    expect(first).toEqual(second);
    // Weighted over the six scored factors: crop 100, quality 100, quantity 40,
    // price 100, distance (same district) 100, availability 100.
    const weighted =
      (0.25 * 100 + 0.2 * 100 + 0.15 * 40 + 0.15 * 100 + 0.1 * 100 + 0.1 * 100) /
      0.95;
    expect(first.score).toBe(Math.round(weighted));
  });

  it("returns a hard zero for a different crop", () => {
    const onion = { ...requirement, crop: "onion" };
    const match = scoreListingAgainstRequirement(listing, onion);
    expect(match.score).toBe(0);
    expect(match.reasons.some((reason) => reason.tone === "limitation")).toBe(true);
  });

  it("scores partial supply honestly (20 of 50 required)", () => {
    const match = scoreListingAgainstRequirement(listing, requirement);
    const quantity = match.factors.find((factor) => factor.key === "quantity");
    expect(quantity?.score).toBe(40);
    expect(
      match.reasons.some(
        (reason) =>
          reason.tone === "limitation" && reason.text.includes("Partial supply"),
      ),
    ).toBe(true);
  });

  it("gives full quantity credit when supply meets or exceeds demand", () => {
    const enough = { ...listing, quantity: 60 };
    const match = scoreListingAgainstRequirement(enough, requirement);
    const quantity = match.factors.find((factor) => factor.key === "quantity");
    expect(quantity?.score).toBe(100);
  });

  it("compares quantities across different units via quintal normalization", () => {
    const inKg = { ...listing, quantity: 5000, unit: "kg" as const };
    const match = scoreListingAgainstRequirement(inKg, requirement);
    const quantity = match.factors.find((factor) => factor.key === "quantity");
    // 5000 kg = 50 quintal → full supply.
    expect(quantity?.score).toBe(100);
  });

  it("rewards asking prices inside the target range and penalises above it", () => {
    const inside = scoreListingAgainstRequirement(listing, requirement);
    const price = inside.factors.find((factor) => factor.key === "price");
    expect(price?.score).toBe(100);

    const tooHigh = { ...listing, askingPricePerUnit: 3100 };
    const above = scoreListingAgainstRequirement(tooHigh, requirement);
    const abovePrice = above.factors.find((factor) => factor.key === "price");
    // (3100 − 2800)/2800 = 10.7% over max → ~79 (weaker but not zero).
    expect(abovePrice?.score).toBe(79);
    expect(
      above.reasons.some((reason) => reason.text.includes("above the target maximum")),
    ).toBe(true);
  });

  it("marks a price below the target minimum as cheaper than expected", () => {
    const cheap = { ...listing, askingPricePerUnit: 2400 };
    const match = scoreListingAgainstRequirement(cheap, requirement);
    const price = match.factors.find((factor) => factor.key === "price");
    expect(price?.score).toBe(75);
    expect(
      match.reasons.some((reason) => reason.text.includes("below the target minimum")),
    ).toBe(true);
  });

  it("does not score price when no asking price is set", () => {
    const noPrice = { ...listing, askingPricePerUnit: undefined };
    const match = scoreListingAgainstRequirement(noPrice, requirement);
    const price = match.factors.find((factor) => factor.key === "price");
    expect(price?.score).toBeNull();
  });

  it("scores quality exactly, higher, lower and ungraded cases", () => {
    const exact = scoreListingAgainstRequirement(listing, requirement);
    expect(exact.factors.find((f) => f.key === "quality")?.score).toBe(100);

    const lowerGrade = { ...listing, quality: "b" as const };
    const lower = scoreListingAgainstRequirement(lowerGrade, requirement);
    expect(lower.factors.find((f) => f.key === "quality")?.score).toBe(50);

    const higherGrade = { ...listing, quality: "a" as const };
    const reqB = { ...requirement, quality: "b" as const };
    const higher = scoreListingAgainstRequirement(higherGrade, reqB);
    expect(higher.factors.find((f) => f.key === "quality")?.score).toBe(95);

    const ungraded = { ...listing, quality: "ungraded" as const };
    const ungradedMatch = scoreListingAgainstRequirement(ungraded, requirement);
    expect(ungradedMatch.factors.find((f) => f.key === "quality")?.score).toBe(55);
  });

  it("uses real coordinates for distance when both sides have them", () => {
    const withGeoListing = {
      ...listing,
      location: { district: "Nashik", state: "Maharashtra", geo: { coordinates: [73.79, 20.01] as [number, number] } },
    };
    const withGeoRequirement = {
      ...requirement,
      location: { district: "Nashik", state: "Maharashtra", geo: { coordinates: [73.79, 20.01] as [number, number] } },
    };
    const match = scoreListingAgainstRequirement(withGeoListing, withGeoRequirement);
    const distance = match.factors.find((factor) => factor.key === "distance");
    expect(distance?.score).toBe(100);
    expect(match.distanceKm).toBe(0);
  });

  it("never invents a distance when coordinates are missing", () => {
    const match = scoreListingAgainstRequirement(listing, requirement);
    const distance = match.factors.find((factor) => factor.key === "distance");
    expect(distance?.score).not.toBeNull(); // same-district text proximity is honest
    expect(match.distanceKm).toBeUndefined();

    const otherState = {
      ...requirement,
      location: { district: "Jaipur", state: "Rajasthan" },
    };
    const crossState = scoreListingAgainstRequirement(listing, otherState);
    const crossDistance = crossState.factors.find((factor) => factor.key === "distance");
    expect(crossDistance?.score).toBeNull();
    expect(
      crossState.reasons.some((reason) => reason.text.includes("not scored")),
    ).toBe(true);
  });

  it("fails availability when produce is ready after the required date", () => {
    const late = { ...listing, expectedHarvestDate: "2026-09-20" };
    const match = scoreListingAgainstRequirement(late, requirement);
    const availability = match.factors.find((factor) => factor.key === "availability");
    expect(availability?.score).toBe(0);
    expect(
      match.reasons.some((reason) => reason.text.includes("after the required-by date")),
    ).toBe(true);
  });

  it("renormalises over remaining weights when price cannot be scored", () => {
    const noPrice = { ...listing, askingPricePerUnit: undefined };
    const match = scoreListingAgainstRequirement(noPrice, requirement);
    const price = match.factors.find((factor) => factor.key === "price");
    expect(price?.score).toBeNull();
    // Scored: crop 100, quality 100, quantity 40, distance 100, availability 100
    // over applicable weight 0.80 → 71 / 0.80 = 88.75 ≈ 89 (not 100 — quantity
    // is still only partial and is honestly visible in the score).
    expect(match.score).toBe(89);
  });

  it("exposes compatibility flags that filters can use", () => {
    const match = scoreListingAgainstRequirement(listing, requirement);
    const flags = matchCompatibility(match);
    expect(flags.strong).toBe(true);
    expect(flags.priceCompatible).toBe(true);
    expect(flags.qualityCompatible).toBe(true);
    expect(flags.nearby).toBe(true);
    expect(flags.quantityCompatible).toBe(false); // 20 of 50 required

    const weak = scoreListingAgainstRequirement(
      { ...listing, crop: "onion" },
      requirement,
    );
    expect(matchCompatibility(weak).strong).toBe(false);
  });
});

describe("estimateDistanceKm", () => {
  it("returns 0 for the same coordinates", () => {
    expect(estimateDistanceKm({ coordinates: [73, 20] }, { coordinates: [73, 20] })).toBe(0);
  });

  it("estimates about 111 km per degree of latitude", () => {
    // GeoJSON order is [longitude, latitude].
    const distance = estimateDistanceKm({ coordinates: [0, 0] }, { coordinates: [0, 1] });
    expect(distance).toBeGreaterThanOrEqual(110);
    expect(distance).toBeLessThanOrEqual(112);
  });
});
