import type { MeasurementUnit } from "@/constants/measurement-units";

export type MarketAvailability =
  | "fresh"
  | "stale"
  | "unavailable"
  | "unconfigured";

export interface MarketScope {
  crop?: string;
  commodity?: string;
  state?: string;
  district?: string;
  market?: string;
}

export interface MarketPriceView {
  id: string;
  commodity: string;
  crop?: string;
  variety?: string;
  grade?: string;
  market: string;
  district?: string;
  state?: string;
  unit: MeasurementUnit;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  currency: string;
  arrivalDate?: string;
  source?: string;
  fetchedAt: string;
  expectedNetPrice?: number;
}

export interface MarketPricesResult {
  availability: MarketAvailability;
  records: MarketPriceView[];
  meta: {
    count: number;
    scopeLabel?: string;
    lastUpdated?: string;
    source?: string;
    message?: string;
  };
}

export interface StoredObservation {
  commodity: string;
  crop?: string;
  variety?: string;
  grade?: string;
  market: string;
  district?: string;
  state?: string;
  unit: MeasurementUnit;
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  currency: string;
  arrivalDate?: Date;
  source?: string;
  externalId?: string;
}
