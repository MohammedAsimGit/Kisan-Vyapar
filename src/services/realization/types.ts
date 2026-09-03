import type { Currency } from "@/constants/currencies";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { GeoCoordinate } from "@/services/maps/types";

export type CostKind = "transport" | "handling" | "commission" | "other";

export interface CostItem {
  kind: CostKind;
  label?: string;
  amount: number;
  currency: Currency;
}

export interface NetRealizationEstimate {
  expectedSellingValue: number;
  totalCosts: number;
  netRealization: number;
  currency: Currency;
  costItems: CostItem[];
}

export interface RealizationEstimateRequest {
  quantity: number;
  unit: MeasurementUnit;
  expectedPricePerUnit: number;
  currency: Currency;
  pickup: GeoCoordinate;
  destination: GeoCoordinate;
}

/**
 * Contract for estimating net farmer earnings for a selling opportunity.
 *
 * Core Kisan Vyapar concept: the headline price is not the farmer's earnings.
 * Estimated Net Realization = Expected Selling Value - Transportation Cost -
 * Applicable Costs.
 *
 * NOTE: no estimation logic is implemented in Sprint 0 and no cost figures are
 * fabricated. This boundary lets later sprints add cost providers (maps,
 * logistics, mandi) behind a single interface.
 */
export interface RealizationService {
  estimate(request: RealizationEstimateRequest): Promise<NetRealizationEstimate>;
}
