import { getJson } from "./fetch-json";
import type { SessionUser } from "@/features/auth/types";
import type { ProduceListingView } from "@/features/produce/types";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import type { BuyerRequirementView } from "@/features/buyer-requirements/types";
import type { OfferView } from "@/features/offers/types";
import type { DigestMatchRow, MatchPaginationMeta } from "@/features/matching/views";

/**
 * Typed fetchers for the client-side server-state cache. Each one calls the
 * exact same authenticated API a browser would, so nothing about the API
 * contracts changes — the cache simply reuses successful responses.
 */

export interface OfferListResult {
  offers: OfferView[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface VendorRequirementList {
  requirements: BuyerRequirementView[];
  counts: Record<BuyerRequirementStatus, number> | null;
}

/** Vendor dashboard aggregate: requirements + status counts + pending offers. */
export interface VendorDashboardData {
  requirements: BuyerRequirementView[];
  counts: Record<BuyerRequirementStatus, number>;
  pendingCounts: Record<string, number>;
}

export interface FarmerRequirementDigest {
  matches: DigestMatchRow[];
  meta: MatchPaginationMeta;
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  const data = await getJson<{ user: SessionUser | null }>("/api/auth/session");
  return data.user;
}

export async function fetchProduceListings(): Promise<ProduceListingView[]> {
  const data = await getJson<{ listings: ProduceListingView[] }>("/api/farmer/produce");
  return data.listings;
}

export async function fetchFarmerOffers(page: number): Promise<OfferListResult> {
  return getJson<OfferListResult>(`/api/farmer/offers?page=${page}`);
}

export async function fetchFarmerOffer(offerId: string): Promise<OfferView> {
  const data = await getJson<{ offer: OfferView }>(`/api/farmer/offers/${offerId}`);
  return data.offer;
}

export async function fetchVendorOffers(
  page: number,
  requirementId?: string,
): Promise<OfferListResult> {
  const query = new URLSearchParams({ page: String(page) });
  if (requirementId) {
    query.set("requirementId", requirementId);
  }
  return getJson<OfferListResult>(`/api/vendor/offers?${query.toString()}`);
}

export async function fetchVendorOffer(offerId: string): Promise<OfferView> {
  const data = await getJson<{ offer: OfferView }>(`/api/vendor/offers/${offerId}`);
  return data.offer;
}

export async function fetchVendorRequirements(): Promise<VendorRequirementList> {
  return getJson<VendorRequirementList>("/api/vendor/requirements");
}

export async function fetchVendorDashboard(): Promise<VendorDashboardData> {
  return getJson<VendorDashboardData>("/api/vendor/dashboard");
}

export interface VendorProfileData {
  profile: {
    businessName?: string;
    businessType?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  } | null;
}

export async function fetchVendorProfile(): Promise<VendorProfileData["profile"]> {
  const data = await getJson<VendorProfileData>("/api/profile");
  return data.profile;
}

export function digestQueryString(params: {
  page?: number;
  filter?: string;
  sort?: string;
}): string {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.filter) searchParams.set("filter", params.filter);
  if (params.sort) searchParams.set("sort", params.sort);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function fetchFarmerRequirementDigest(params: {
  page?: number;
  filter?: string;
  sort?: string;
}): Promise<FarmerRequirementDigest> {
  return getJson<FarmerRequirementDigest>(
    `/api/farmer/requirements${digestQueryString(params)}`,
  );
}