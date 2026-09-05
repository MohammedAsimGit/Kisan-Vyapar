import type { ScoreBand } from "./config";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import type { MatchCompatibility, MatchReason } from "./types";

export interface FactorView {
  key: string;
  label: string;
  /** null when the factor could not be scored (not an error). */
  score: number | null;
  detail?: string;
}

export interface MatchView {
  score: number;
  band: ScoreBand;
  factors: FactorView[];
  reasons: MatchReason[];
  flags: MatchCompatibility;
}

export interface VendorSummaryView {
  businessName?: string;
}

export interface FarmerSummaryView {
  farmerName?: string;
}

export interface RequirementSummaryView {
  id: string;
  crop: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  qualityLabel: string;
  quantity: number;
  unit: string;
  unitLabel: string;
  targetPriceMin: number;
  targetPriceMax: number;
  locationText?: string;
  requiredBy: string;
  notes?: string;
  status: BuyerRequirementStatus;
  vendor?: VendorSummaryView;
}

export interface ListingSummaryView {
  id: string;
  crop: string;
  cropName: string;
  cropEmoji?: string;
  variety?: string;
  qualityLabel: string;
  quantity: number;
  unit: string;
  unitLabel: string;
  askingPricePerUnit?: number;
  locationText?: string;
  expectedHarvestDate?: string;
  farmer?: FarmerSummaryView;
}

export interface RequirementMatchRow {
  requirement: RequirementSummaryView;
  match: MatchView;
}

export interface ListingMatchRow {
  listing: ListingSummaryView;
  match: MatchView;
}

export interface DigestMatchRow {
  listing: ListingSummaryView;
  requirement: RequirementSummaryView;
  match: MatchView;
}

export interface MatchPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  filter: string;
  sort: string;
}
