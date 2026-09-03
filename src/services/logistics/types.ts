import type { Currency } from "@/constants/currencies";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { GeoCoordinate } from "@/services/maps/types";

export interface TransportEstimateRequest {
  pickup: GeoCoordinate;
  dropoff: GeoCoordinate;
  quantity: number;
  unit: MeasurementUnit;
  requiredBy?: Date;
}

export interface TransportEstimate {
  estimatedCost: number;
  currency: Currency;
  estimatedHours?: number;
  providerName?: string;
}

/**
 * Contract for a logistics / transport estimation provider.
 *
 * NOTE: no concrete provider is implemented yet. Sprint 0 only establishes the
 * boundary. Transport cost estimates will feed the net-realization concept in a
 * later sprint.
 */
export interface LogisticsService {
  estimateTransport(request: TransportEstimateRequest): Promise<TransportEstimate>;
}
