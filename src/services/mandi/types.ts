import type { Currency } from "@/constants/currencies";
import type { MeasurementUnit } from "@/constants/measurement-units";

/**
 * A single normalized market-price record produced by a mandi (agricultural
 * market) data provider. This is the internal representation the rest of the
 * application consumes; external provider response formats must be mapped to
 * this shape inside an adapter and must never leak into application code.
 */
export interface MandiPriceRecord {
  commodity: string;
  variety?: string;
  market: string;
  district?: string;
  state?: string;
  unit: MeasurementUnit;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  currency: Currency;
  recordedAt: Date;
  externalId?: string;
}

export interface MandiPriceQuery {
  commodity?: string;
  market?: string;
  district?: string;
  state?: string;
  from?: Date;
  to?: Date;
  limit?: number;
}

/**
 * Contract for a mandi price data source.
 *
 * NOTE: no concrete provider is implemented yet. Sprint 0 only establishes the
 * boundary. A government/registry API adapter should implement this interface,
 * normalize its response to `MandiPriceRecord`, and be selected via
 * configuration (MANDI_API_URL / MANDI_API_KEY) in a later sprint.
 */
export interface MandiPriceProvider {
  fetchLatestPrices(query: MandiPriceQuery): Promise<MandiPriceRecord[]>;
}
