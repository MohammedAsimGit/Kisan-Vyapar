import "server-only";
import { connectToDatabase } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import {
  BuyerRequirementModel,
  FarmerProfileModel,
  ProduceListingModel,
  UserModel,
  VendorProfileModel,
} from "@/models";
import { BUYER_REQUIREMENT_STATUS } from "@/constants/buyer-requirement-statuses";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import { PRODUCE_LISTING_STATUS } from "@/constants/produce-listing-statuses";
import type { ProduceListingStatus } from "@/constants/produce-listing-statuses";
import type { MeasurementUnit } from "@/constants/measurement-units";
import type { QualityGrade } from "@/constants/quality-grades";
import { toBuyerRequirementView } from "@/features/buyer-requirements/types";
import type { BuyerRequirementView } from "@/features/buyer-requirements/types";
import { toProduceListingView } from "@/features/produce/types";
import type { ProduceListingView } from "@/features/produce/types";
import { scoreBand } from "./config";
import {
  matchCompatibility,
  scoreListingAgainstRequirement,
} from "./engine";
import type { MatchQuery } from "./query-schema";
import type {
  ListingSnapshot,
  MatchDetail,
  RequirementSnapshot,
} from "./types";
import type {
  DigestMatchRow,
  ListingMatchRow,
  ListingSummaryView,
  MatchPaginationMeta,
  MatchView,
  RequirementMatchRow,
  RequirementSummaryView,
} from "./views";

const { ACTIVE: ACTIVE_REQUIREMENT } = BUYER_REQUIREMENT_STATUS;
const { ACTIVE: ACTIVE_LISTING } = PRODUCE_LISTING_STATUS;

interface LeanAddress {
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

interface LeanLocation {
  label?: string;
  geo?: { type?: string; coordinates?: number[] } | null;
  address?: LeanAddress;
}

interface LeanListing {
  _id: unknown;
  farmer: unknown;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  pricePerUnit?: number | null;
  currency?: string;
  expectedHarvestDate?: Date | null;
  location?: LeanLocation;
  status: ProduceListingStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LeanRequirement {
  _id: unknown;
  vendor: unknown;
  crop: string;
  variety?: string;
  quality?: QualityGrade;
  quantity: number;
  unit: MeasurementUnit;
  targetPriceMin: number;
  targetPriceMax: number;
  currency?: string;
  requiredBy: Date;
  notes?: string;
  location?: LeanLocation;
  status: BuyerRequirementStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function coordinatesOf(location?: LeanLocation): [number, number] | undefined {
  const coordinates = location?.geo?.coordinates;
  if (
    !coordinates ||
    coordinates.length !== 2 ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1])
  ) {
    return undefined;
  }
  // Never trust placeholder origins: [0,0] is not a real farm location.
  if (coordinates[0] === 0 && coordinates[1] === 0) {
    return undefined;
  }
  return [coordinates[0], coordinates[1]];
}

function listingSnapshot(doc: LeanListing): ListingSnapshot {
  const coordinates = coordinatesOf(doc.location);
  return {
    id: String(doc._id),
    crop: doc.crop,
    variety: doc.variety,
    quality: doc.quality,
    quantity: doc.quantity,
    unit: doc.unit,
    askingPricePerUnit: doc.pricePerUnit ?? undefined,
    currency: (doc.currency ?? "INR") as "INR",
    location: {
      geo: coordinates ? { coordinates } : undefined,
      district: doc.location?.address?.district,
      state: doc.location?.address?.state,
    },
    expectedHarvestDate: doc.expectedHarvestDate ?? undefined,
  };
}

function requirementSnapshot(doc: LeanRequirement): RequirementSnapshot {
  const coordinates = coordinatesOf(doc.location);
  return {
    id: String(doc._id),
    crop: doc.crop,
    variety: doc.variety,
    quality: doc.quality,
    quantity: doc.quantity,
    unit: doc.unit,
    targetPriceMinPerUnit: doc.targetPriceMin,
    targetPriceMaxPerUnit: doc.targetPriceMax,
    currency: (doc.currency ?? "INR") as "INR",
    location: {
      geo: coordinates ? { coordinates } : undefined,
      district: doc.location?.address?.district,
      state: doc.location?.address?.state,
    },
    requiredBy: doc.requiredBy,
  };
}

function buildMatchView(detail: MatchDetail): MatchView {
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

function requirementSummaryView(
  view: BuyerRequirementView,
  businessName?: string,
): RequirementSummaryView {
  return {
    id: view.id,
    crop: view.crop,
    cropName: view.cropName,
    cropEmoji: view.cropEmoji,
    variety: view.variety,
    qualityLabel: view.qualityLabel,
    quantity: view.quantity,
    unit: view.unit,
    unitLabel: view.unitLabel,
    targetPriceMin: view.targetPriceMin,
    targetPriceMax: view.targetPriceMax,
    locationText: view.locationText || undefined,
    requiredBy: view.requiredBy,
    notes: view.notes,
    ...(businessName ? { vendor: { businessName } } : {}),
  };
}

function listingSummaryView(
  view: ProduceListingView,
  farmerName?: string,
): ListingSummaryView {
  return {
    id: view.id,
    crop: view.crop,
    cropName: view.cropName,
    cropEmoji: view.cropEmoji,
    variety: view.variety,
    qualityLabel: view.qualityLabel,
    quantity: view.quantity,
    unit: view.unit,
    unitLabel: view.unitLabel,
    askingPricePerUnit: view.askingPrice,
    locationText: view.locationText || undefined,
    expectedHarvestDate: view.expectedHarvestDate,
    ...(farmerName ? { farmer: { farmerName } } : {}),
  };
}

interface ScoredRequirementRow {
  requirementView: BuyerRequirementView;
  match: MatchDetail;
}

interface ScoredListingRow {
  listingView: ProduceListingView;
  listingDoc: LeanListing;
  match: MatchDetail;
}

function applyFiltersAndPagination<T>(
  rows: T[],
  query: MatchQuery,
  matchOf: (row: T) => MatchDetail,
  sortOf: (row: T) => { requiredBy?: string; distanceScore?: number | null },
): { rows: T[]; total: number; meta: MatchPaginationMeta } {
  const { page, limit, filter, sort } = query;

  const matchesFilter = (row: T): boolean => {
    if (filter === "all") {
      return true;
    }
    const flags = matchCompatibility(matchOf(row));
    switch (filter) {
      case "strong":
        return flags.strong;
      case "price":
        return flags.priceCompatible;
      case "quality":
        return flags.qualityCompatible;
      case "quantity":
        return flags.quantityCompatible;
      case "nearby":
        return flags.nearby;
      default:
        return true;
    }
  };

  const filtered = rows.filter(matchesFilter);

  const sorted = [...filtered].sort((left, right) => {
    const leftMeta = sortOf(left);
    const rightMeta = sortOf(right);
    if (sort === "nearest") {
      const leftDistance = leftMeta.distanceScore ?? -1;
      const rightDistance = rightMeta.distanceScore ?? -1;
      return rightDistance - leftDistance;
    }
    if (sort === "deadline") {
      const leftKey = leftMeta.requiredBy ?? "";
      const rightKey = rightMeta.requiredBy ?? "";
      return leftKey.localeCompare(rightKey);
    }
    return matchOf(right).score - matchOf(left).score;
  });

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const rowsForPage = sorted.slice(start, start + limit);

  return {
    rows: rowsForPage,
    total,
    meta: {
      page,
      limit,
      total,
      totalPages,
      filter,
      sort,
    },
  };
}

async function vendorNamesByIds(vendorProfileIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (vendorProfileIds.length === 0) {
    return map;
  }
  const profiles = (await VendorProfileModel.find({
    _id: { $in: vendorProfileIds },
  })
    .select({ businessName: 1 })
    .lean()) as unknown as Array<{ _id: unknown; businessName?: string }>;
  for (const profile of profiles) {
    if (profile.businessName) {
      map.set(String(profile._id), profile.businessName);
    }
  }
  return map;
}

async function farmerNamesByProfileIds(farmerProfileIds: string[]): Promise<Map<string, string>> {
  const byProfileId = new Map<string, string>();
  if (farmerProfileIds.length === 0) {
    return byProfileId;
  }
  const profiles = (await FarmerProfileModel.find({ _id: { $in: farmerProfileIds } })
    .select({ user: 1 })
    .lean()) as unknown as Array<{ _id: unknown; user?: unknown }>;

  const userIds = profiles
    .map((profile) => (profile.user ? String(profile.user) : undefined))
    .filter((id): id is string => Boolean(id));

  const namesByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const users = (await UserModel.find({ _id: { $in: userIds } })
      .select({ fullName: 1 })
      .lean()) as unknown as Array<{ _id: unknown; fullName?: string }>;
    for (const user of users) {
      if (user.fullName) {
        namesByUserId.set(String(user._id), user.fullName);
      }
    }
  }

  for (const profile of profiles) {
    const userId = profile.user ? String(profile.user) : undefined;
    const name = userId ? namesByUserId.get(userId) : undefined;
    if (name) {
      byProfileId.set(String(profile._id), name);
    }
  }
  return byProfileId;
}

function distanceScoreOf(match: MatchDetail): number | null {
  return match.factors.find((factor) => factor.key === "distance")?.score ?? null;
}

export interface ProduceMatchesResult {
  listing: ListingSummaryView;
  matches: RequirementMatchRow[];
  meta: MatchPaginationMeta;
}

/**
 * Farmer side: all active buying requirements that a published produce listing
 * could supply, ranked by the deterministic match score.
 */
export async function getMatchesForProduceListing(
  listingId: string,
  farmerProfileId: string,
  query: MatchQuery,
): Promise<ProduceMatchesResult | null> {
  await connectToDatabase();

  const listingDoc = (await ProduceListingModel.findOne({
    _id: listingId,
    farmer: farmerProfileId,
  }).lean()) as unknown as LeanListing | null;

  if (!listingDoc) {
    return null;
  }
  if (listingDoc.status !== ACTIVE_LISTING) {
    throw new ConflictError(
      "This crop is not published, so it cannot see buyer requirements. Publish it first.",
    );
  }

  const listingView = toProduceListingView(listingDoc);
  const requirements = (await BuyerRequirementModel.find({
    crop: listingDoc.crop,
    status: ACTIVE_REQUIREMENT,
    requiredBy: { $gte: startOfTodayUtc() },
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanRequirement[];

  const vendorIds = requirements.map((requirement) => String(requirement.vendor));
  const names = await vendorNamesByIds(vendorIds);

  const scored: Array<{
    vendorId: string;
    requirementView: BuyerRequirementView;
    match: MatchDetail;
  }> = requirements.map((requirement) => ({
    vendorId: String(requirement.vendor),
    requirementView: toBuyerRequirementView(requirement),
    match: scoreListingAgainstRequirement(
      listingSnapshot(listingDoc),
      requirementSnapshot(requirement),
    ),
  }));

  const { rows, meta } = applyFiltersAndPagination(
    scored,
    query,
    (row) => row.match,
    (row) => ({ requiredBy: row.requirementView.requiredBy, distanceScore: distanceScoreOf(row.match) }),
  );

  return {
    listing: listingSummaryView(listingView),
    matches: rows.map((row) => ({
      requirement: requirementSummaryView(
        row.requirementView,
        names.get(row.vendorId),
      ),
      match: buildMatchView(row.match),
    })),
    meta,
  };
}

export interface RequirementMatchesResult {
  requirement: RequirementSummaryView;
  matches: ListingMatchRow[];
  meta: MatchPaginationMeta;
}

/**
 * Vendor side: published farmer produce that could supply an active buying
 * requirement, ranked by the deterministic match score.
 */
export async function getMatchesForRequirement(
  requirementId: string,
  vendorProfileId: string,
  query: MatchQuery,
): Promise<RequirementMatchesResult | null> {
  await connectToDatabase();

  const requirementDoc = (await BuyerRequirementModel.findOne({
    _id: requirementId,
    vendor: vendorProfileId,
  }).lean()) as unknown as LeanRequirement | null;

  if (!requirementDoc) {
    return null;
  }
  if (requirementDoc.status !== ACTIVE_REQUIREMENT) {
    throw new ConflictError(
      "Only an active requirement can show matching farmers. Resume it first.",
    );
  }

  const requirementView = toBuyerRequirementView(requirementDoc);
  const listingDocs = (await ProduceListingModel.find({
    crop: requirementDoc.crop,
    status: ACTIVE_LISTING,
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanListing[];

  const farmerProfileIds = listingDocs.map((listing) => String(listing.farmer));
  const names = await farmerNamesByProfileIds(farmerProfileIds);

  const scored: Array<ScoredListingRow> = listingDocs.map((listingDoc) => ({
    listingView: toProduceListingView(listingDoc),
    listingDoc,
    match: scoreListingAgainstRequirement(
      listingSnapshot(listingDoc),
      requirementSnapshot(requirementDoc),
    ),
  }));

  const { rows, meta } = applyFiltersAndPagination(
    scored,
    query,
    (row) => row.match,
    (row) => ({ requiredBy: row.listingView.expectedHarvestDate, distanceScore: distanceScoreOf(row.match) }),
  );

  return {
    requirement: requirementSummaryView(requirementView),
    matches: rows.map((row) => ({
      listing: listingSummaryView(
        row.listingView,
        names.get(String(row.listingDoc.farmer)),
      ),
      match: buildMatchView(row.match),
    })),
    meta,
  };
}

export interface FarmerDigestResult {
  matches: DigestMatchRow[];
  meta: MatchPaginationMeta;
}

/**
 * Farmer home digest: the strongest buyer requirements across all of a
 * farmer's published produce listings, each with the listing that matched.
 */
export async function getFarmerRequirementDigest(
  farmerProfileId: string,
  query: MatchQuery,
): Promise<FarmerDigestResult> {
  await connectToDatabase();

  const listingDocs = (await ProduceListingModel.find({
    farmer: farmerProfileId,
    status: ACTIVE_LISTING,
  })
    .sort({ createdAt: -1 })
    .lean()) as unknown as LeanListing[];

  const crops = Array.from(new Set(listingDocs.map((listing) => listing.crop)));
  const requirements =
    crops.length === 0
      ? []
      : ((await BuyerRequirementModel.find({
          crop: { $in: crops },
          status: ACTIVE_REQUIREMENT,
          requiredBy: { $gte: startOfTodayUtc() },
        })
          .sort({ createdAt: -1 })
          .lean()) as unknown as LeanRequirement[]);

  const vendorIds = requirements.map((requirement) => String(requirement.vendor));
  const names = await vendorNamesByIds(vendorIds);

  const rows: Array<{
    vendorId: string;
    listingView: ProduceListingView;
    requirementView: BuyerRequirementView;
    match: MatchDetail;
  }> = [];
  for (const listingDoc of listingDocs) {
    const snapshot = listingSnapshot(listingDoc);
    const listingView = toProduceListingView(listingDoc);
    for (const requirement of requirements) {
      rows.push({
        vendorId: String(requirement.vendor),
        listingView,
        requirementView: toBuyerRequirementView(requirement),
        match: scoreListingAgainstRequirement(snapshot, requirementSnapshot(requirement)),
      });
    }
  }

  const { rows: paged, meta } = applyFiltersAndPagination(
    rows,
    query,
    (row) => row.match,
    (row) => ({ requiredBy: row.requirementView.requiredBy, distanceScore: distanceScoreOf(row.match) }),
  );

  return {
    matches: paged.map((row) => ({
      listing: listingSummaryView(row.listingView),
      requirement: requirementSummaryView(row.requirementView, names.get(row.vendorId)),
      match: buildMatchView(row.match),
    })),
    meta,
  };
}

export interface FarmerRequirementMatchesResult {
  requirement: RequirementSummaryView;
  matches: ListingMatchRow[];
}

/**
 * Read-only farmer view of a buyer requirement: the requirement itself plus the
 * farmer's own published produce that could supply it (with real scores).
 */
export async function getFarmerRequirementMatches(
  requirementId: string,
  farmerProfileId: string,
): Promise<FarmerRequirementMatchesResult | null> {
  await connectToDatabase();

  const requirementDoc = (await BuyerRequirementModel.findById(requirementId)
    .lean()) as unknown as LeanRequirement | null;
  if (!requirementDoc) {
    return null;
  }

  const [names, listingDocs] = await Promise.all([
    vendorNamesByIds([String(requirementDoc.vendor)]),
    ProduceListingModel.find({
      farmer: farmerProfileId,
      crop: requirementDoc.crop,
      status: ACTIVE_LISTING,
    })
      .sort({ createdAt: -1 })
      .lean() as unknown as Promise<LeanListing[]>,
  ]);

  const requirementView = toBuyerRequirementView(requirementDoc);
  const requirementSnapshotValue = requirementSnapshot(requirementDoc);

  const matches: ListingMatchRow[] = listingDocs
    .map((listingDoc) => ({
      listingView: toProduceListingView(listingDoc),
      listingDoc,
      match: scoreListingAgainstRequirement(
        listingSnapshot(listingDoc),
        requirementSnapshotValue,
      ),
    }))
    .sort((left, right) => right.match.score - left.match.score)
    .map((row) => ({
      listing: listingSummaryView(row.listingView),
      match: buildMatchView(row.match),
    }));

  return {
    requirement: requirementSummaryView(
      requirementView,
      names.get(String(requirementDoc.vendor)),
    ),
    matches,
  };
}

