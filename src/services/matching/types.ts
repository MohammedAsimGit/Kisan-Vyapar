import type { Currency } from "@/constants/currencies";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { GeoCoordinate } from "@/services/maps/types";

export interface MatchListingCandidate {
  listingId: string;
  crop: string;
  variety?: string;
  quality?: string;
  quantity: number;
  unit: MeasurementUnit;
  pricePerUnit: number;
  currency: Currency;
  location?: GeoCoordinate;
  availableFrom?: Date;
}

export interface MatchRequirementCandidate {
  requirementId: string;
  crop: string;
  variety?: string;
  quality?: string;
  quantity: number;
  unit: MeasurementUnit;
  maxPricePerUnit: number;
  currency: Currency;
  location?: GeoCoordinate;
  requiredBy?: Date;
}

export interface MatchScore {
  score: number;
  explanation: string[];
}

/**
 * Configurable weights used by the future matching engine.
 *
 * NOTE: no calibrated defaults are provided yet. When the matching algorithm is
 * implemented, weights must be centralized (configuration, not scattered code)
 * and tuned against real data before being enabled.
 */
export interface MatchingWeights {
  cropCompatibility: number;
  qualityFit: number;
  quantityFit: number;
  priceFit: number;
  distanceFit: number;
  availabilityFit: number;
  buyerDemand: number;
  reliability: number;
}

/**
 * Contract for the smart matching engine that pairs farmers and vendors.
 *
 * NOTE: no scoring algorithm is implemented in Sprint 0. This boundary exists so
 * future matching work depends on normalized inputs and a stable interface
 * rather than on concrete model or provider shapes.
 */
export interface MatchingService {
  scoreListing(
    listing: MatchListingCandidate,
    requirement: MatchRequirementCandidate,
  ): Promise<MatchScore>;
}
