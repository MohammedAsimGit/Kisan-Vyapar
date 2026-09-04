import "server-only";
import { connectToDatabase } from "@/lib/db";
import { MarketPriceModel } from "@/models";
import { buildRecordKey } from "./normalizer";
import type {
  MarketPriceView,
  MarketScope,
  StoredObservation,
} from "./types";

type LeanDoc = {
  _id: unknown;
  commodity: string;
  crop?: string;
  variety?: string;
  grade?: string;
  market: string;
  district?: string;
  state?: string;
  unit: StoredObservation["unit"];
  minPrice?: number;
  maxPrice?: number;
  modalPrice: number;
  currency: string;
  arrivalDate?: Date | null;
  source?: string;
  fetchedAt: Date;
};

function toView(doc: LeanDoc): MarketPriceView {
  return {
    id: String(doc._id),
    commodity: doc.commodity,
    crop: doc.crop,
    variety: doc.variety,
    grade: doc.grade,
    market: doc.market,
    district: doc.district,
    state: doc.state,
    unit: doc.unit,
    minPrice: doc.minPrice,
    maxPrice: doc.maxPrice,
    modalPrice: doc.modalPrice,
    currency: doc.currency,
    arrivalDate: doc.arrivalDate ? doc.arrivalDate.toISOString() : undefined,
    source: doc.source,
    fetchedAt: doc.fetchedAt.toISOString(),
  };
}

function scopeFilter(scope: MarketScope): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (scope.crop) {
    filter.crop = scope.crop;
  }
  if (scope.commodity) {
    filter.commodity = new RegExp(`^${escapeRegExp(scope.commodity)}$`, "i");
  }
  if (scope.state) {
    filter.state = new RegExp(`^${escapeRegExp(scope.state)}$`, "i");
  }
  if (scope.district) {
    filter.district = new RegExp(`^${escapeRegExp(scope.district)}$`, "i");
  }
  if (scope.market) {
    filter.market = new RegExp(escapeRegExp(scope.market), "i");
  }
  return filter;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function persistMarketObservations(
  observations: StoredObservation[],
): Promise<{ inserted: number }> {
  await connectToDatabase();

  let inserted = 0;

  for (const observation of observations) {
    const recordKey = buildRecordKey(observation);
    const result = await MarketPriceModel.updateOne(
      { recordKey },
      {
        $setOnInsert: {
          commodity: observation.commodity,
          crop: observation.crop,
          variety: observation.variety,
          grade: observation.grade,
          market: observation.market,
          district: observation.district,
          state: observation.state,
          unit: observation.unit,
          minPrice: observation.minPrice,
          maxPrice: observation.maxPrice,
          modalPrice: observation.modalPrice,
          currency: observation.currency,
          arrivalDate: observation.arrivalDate,
          source: observation.source,
          fetchedAt: new Date(),
          externalId: observation.externalId,
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount > 0) {
      inserted += 1;
    }
  }

  return { inserted };
}

export async function getMarketPricesForScope(
  scope: MarketScope,
  limit = 25,
): Promise<{ records: MarketPriceView[]; newestFetchedAt: Date | null }> {
  await connectToDatabase();

  const docs = (await MarketPriceModel.find(scopeFilter(scope))
    .sort({ arrivalDate: -1, fetchedAt: -1 })
    .limit(limit)
    .lean()) as unknown as LeanDoc[];

  const newest = docs.reduce<Date | null>(
    (latest, doc) =>
      !latest || doc.fetchedAt.getTime() > latest.getTime()
        ? doc.fetchedAt
        : latest,
    null,
  );

  return { records: docs.map(toView), newestFetchedAt: newest };
}
