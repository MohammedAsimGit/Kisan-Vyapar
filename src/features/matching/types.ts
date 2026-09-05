import type { Currency } from "@/constants/currencies";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { QualityGrade } from "@/constants/quality-grades";
import type { ScoredFactorKey } from "./config";

export interface LocationSnapshot {
  /** Coordinates are only ever present when real (never [0,0] placeholders). */
  geo?: { coordinates: [number, number] } | null;
  district?: string;
  state?: string;
}

export interface ListingSnapshot {
  id: string;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  /** Asking price per unit in the listing's unit — absent means not set. */
  askingPricePerUnit?: number;
  currency?: Currency;
  location?: LocationSnapshot;
  /** Date-only string (YYYY-MM-DD) or Date; compare at day granularity. */
  expectedHarvestDate?: string | Date;
}

export interface RequirementSnapshot {
  id: string;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  targetPriceMinPerUnit?: number;
  targetPriceMaxPerUnit?: number;
  currency?: Currency;
  location?: LocationSnapshot;
  requiredBy?: string | Date;
}

export interface FactorScore {
  key: ScoredFactorKey;
  label: string;
  /**
   * 0–100 when the factor could be scored from real data; null when the data
   * needed is unavailable (factor excluded and the score renormalised).
   */
  score: number | null;
  detail?: string;
}

export type ReasonTone = "positive" | "limitation" | "neutral";

export interface MatchReason {
  tone: ReasonTone;
  text: string;
}

export interface MatchDetail {
  /** Deterministic 0–100 match score. */
  score: number;
  factors: FactorScore[];
  reasons: MatchReason[];
  /** Straight-line km, only when both sides have real coordinates. */
  distanceKm?: number;
}

export interface MatchCompatibility {
  strong: boolean;
  priceCompatible: boolean;
  qualityCompatible: boolean;
  quantityCompatible: boolean;
  nearby: boolean;
}

export type MatchFilter =
  | "all"
  | "strong"
  | "price"
  | "quality"
  | "quantity"
  | "nearby";

export type MatchSort = "score" | "deadline" | "nearest";

export interface MatchPageQuery {
  page?: number;
  limit?: number;
  filter?: MatchFilter;
  sort?: MatchSort;
}
