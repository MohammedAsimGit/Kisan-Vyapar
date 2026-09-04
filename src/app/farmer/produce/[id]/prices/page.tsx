import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Database,
  Info,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getMarketPrices } from "@/features/market/market-service";
import { hasCropMapping } from "@/features/market/crop-commodities";
import type { MarketPriceView } from "@/features/market/types";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Market prices",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function MarketPricesPage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const profileId = await getFarmerProfileRecordId(user.id);
  const listing = profileId ? await getFarmerProduceListing(id, profileId) : null;
  if (!listing) {
    notFound();
  }

  const mapped = hasCropMapping(listing.crop);
  const result = await getMarketPrices({
    crop: listing.crop,
    state: listing.location.state,
    district: listing.location.district,
  });

  const locationLine = [listing.location.village, listing.location.district]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href={`/farmer/produce/${listing.id}`}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to {listing.cropName}
      </Link>

      <PageHeader
        eyebrow="Market prices"
        title={`Price for ${listing.cropName}`}
        description={
          locationLine
            ? `Observed market prices relevant to your crop near ${locationLine}, ${listing.location.state ?? ""}.`
            : `Observed market prices for ${listing.cropName} (${listing.location.state ?? "India"}).`
        }
      />

      {!mapped ? (
        <EmptyState
          icon={<Info className="size-6" />}
          title="No market mapping for this crop yet"
          description="We can't reliably match this crop to official market data at the moment, so we won't show unrelated prices."
        />
      ) : result.records.length === 0 ? (
        <EmptyState
          icon={<Database className="size-6" />}
          title={`No market price data available for ${listing.cropName} here`}
          description={
            result.availability === "unconfigured"
              ? "Market price data has not been configured for this deployment yet. Prices are never invented."
              : "Market prices are temporarily unavailable. Please try again later."
          }
        />
      ) : (
        <PriceResults
          availability={result.availability}
          records={result.records}
          unitLabel={unitLabel(result.records[0]?.unit)}
        />
      )}
    </div>
  );
}

function PriceResults({
  availability,
  records,
  unitLabel,
}: {
  availability: string;
  records: MarketPriceView[];
  unitLabel: string;
}) {
  return (
    <div className="space-y-6">
      {availability === "stale" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning-border bg-warning-bg p-4 text-sm leading-6 text-warning-fg">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          <span>
            Showing the latest available market data. Live update is temporarily
            unavailable.
          </span>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="size-4 text-primary" />
          These are observed market prices — not a recommendation.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((record) => (
          <PriceCard key={record.id} record={record} unitLabel={unitLabel} />
        ))}
      </div>
    </div>
  );
}

function PriceCard({
  record,
  unitLabel,
}: {
  record: MarketPriceView;
  unitLabel: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{record.market}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {[record.district, record.state].filter(Boolean).join(", ") ||
              "India"}
          </p>
        </div>
        <Badge tone="neutral">APMC</Badge>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight">
        {formatINR(record.modalPrice)}
        <span className="ml-1 text-base font-medium text-muted-foreground">
          / {unitLabel}
        </span>
      </p>

      {record.expectedNetPrice !== undefined ? (
        <p className="mt-2 rounded-xl bg-primary-soft px-3 py-2 text-sm text-primary-soft-fg">
          Net after configured costs: {formatINR(record.expectedNetPrice)} /{" "}
          {unitLabel}
        </p>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-muted-foreground">Market range</dt>
          <dd className="mt-1 font-medium text-foreground">
            {record.minPrice !== undefined && record.maxPrice !== undefined
              ? `${formatINR(record.minPrice)} – ${formatINR(record.maxPrice)}`
              : "Not reported"}
          </dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-muted-foreground">Minimum</dt>
          <dd className="mt-1 font-medium text-foreground">
            {record.minPrice !== undefined ? formatINR(record.minPrice) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-muted-foreground">Maximum</dt>
          <dd className="mt-1 font-medium text-foreground">
            {record.maxPrice !== undefined ? formatINR(record.maxPrice) : "—"}
          </dd>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <dt className="text-muted-foreground">Arrival date</dt>
          <dd className="mt-1 font-medium text-foreground">
            {record.arrivalDate ? shortDate(record.arrivalDate) : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        Last updated: {formatDateTime(record.fetchedAt)}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Source: {record.source ?? "Government market data"}
      </p>
    </article>
  );
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatINR(value: number): string {
  return inr.format(value);
}

function unitLabel(unit: string | undefined): string {
  if (unit === "kg") return "Kg";
  if (unit === "tonne") return "Tonne";
  return "Quintal";
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
