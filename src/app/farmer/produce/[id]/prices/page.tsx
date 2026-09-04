import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Check,
  Database,
  Info,
  TrendingUp,
} from "lucide-react";
import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getMarketPrices } from "@/features/market/market-service";
import { hasCropMapping } from "@/features/market/crop-commodities";
import { buildPriceGuidanceDto } from "@/features/pricing/pricing-service";
import type { MarketPriceView } from "@/features/market/types";
import { GuidanceActions } from "@/components/market/guidance-actions";
import {
  MarketRows,
  type MarketRowItem,
} from "@/components/market/market-rows";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Market intelligence",
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
  const market = await getMarketPrices({
    crop: listing.crop,
    state: listing.location.state,
    district: listing.location.district,
  });

  const guidance = buildPriceGuidanceDto(market.records);
  const rows = latestPerMarket(market.records);
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
        eyebrow="Market intelligence"
        title={`${listing.cropName} market`}
        description={
          locationLine
            ? `${listing.quantity} ${listing.unitLabel} · ${listing.qualityLabel} · ${locationLine}, ${listing.location.state ?? ""}`
            : `${listing.quantity} ${listing.unitLabel} · ${listing.qualityLabel}`
        }
      />

      {!mapped ? (
        <EmptyState
          icon={<Info className="size-6" />}
          title="No market mapping for this crop yet"
          description="We can't reliably match this crop to official market data, so no prices are shown."
        />
      ) : guidance.observationCount === 0 ? (
        <EmptyState
          icon={<Database className="size-6" />}
          title={`No market price data available for ${listing.cropName} here`}
          description={
            market.availability === "unconfigured"
              ? "Market price data has not been configured for this deployment yet. Prices are never invented."
              : "Market prices currently unavailable. Please try again later."
          }
        />
      ) : (
        <div className="space-y-8">
          <MarketSnapshot
            guidance={guidance}
            rowCount={rows.length}
            unitLabel={unitLabel(guidance.unit)}
          />

          {guidance.hasSuggestion ? (
            <section className="rounded-3xl border border-primary/30 bg-primary-soft/40 p-6 shadow-card sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Price guidance
              </p>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <p className="text-sm text-muted-foreground">Suggested asking price</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground">
                    {guidance.suggestedPrice !== undefined
                      ? formatInr(guidance.suggestedPrice)
                      : "—"}
                    <span className="ml-1 text-lg font-medium text-muted-foreground">
                      / {unitLabel(guidance.unit)}
                    </span>
                  </p>
                  {guidance.suggestedRange?.min !== undefined &&
                  guidance.suggestedRange.max !== undefined ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Suggested range: {formatInr(guidance.suggestedRange.min)} –{" "}
                      {formatInr(guidance.suggestedRange.max)}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <ConfidenceBadge level={guidance.confidence} />
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-sm font-semibold">Why this price?</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {guidance.factors.slice(0, 4).map((factor) => (
                      <li key={factor} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 border-t border-primary/15 pt-5">
                <GuidanceActions
                  listingId={listing.id}
                  suggestedPrice={guidance.suggestedPrice}
                  unit={unitLabel(guidance.unit)}
                  suggestedMin={guidance.suggestedRange?.min}
                  suggestedMax={guidance.suggestedRange?.max}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                This is decision support based on observed government market data —
                not a guarantee. The final asking price is yours.
              </p>
            </section>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-sm leading-6 text-muted-foreground">
              Not enough market observations to generate a reliable suggestion yet.
            </div>
          )}

          <TrendSection series={guidance.series} unit={guidance.unit} />

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Market prices</h2>
                <p className="text-sm text-muted-foreground">
                  {rows.length} {rows.length === 1 ? "market" : "markets"} ·{" "}
                  {market.meta.scopeLabel ?? "India"} ·{" "}
                  {market.availability === "stale"
                    ? "market data may be outdated"
                    : "latest reported mandi price"}
                  {market.meta.lastUpdated
                    ? ` · updated ${formatUpdated(market.meta.lastUpdated)}`
                    : ""}
                </p>
              </div>
              <Badge tone={market.availability === "stale" ? "warning" : "success"}>
                {market.availability === "fresh" ? "Fresh" : "Updated earlier"}
              </Badge>
            </div>

            <MarketRows rows={rows} unit={unitLabel(guidance.unit)} />
          </section>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="size-4 text-primary" />
            Source: {market.meta.source ?? "Government market data"}
          </p>
        </div>
      )}
    </div>
  );
}

function MarketSnapshot({
  guidance,
  rowCount,
  unitLabel,
}: {
  guidance: ReturnType<typeof buildPriceGuidanceDto>;
  rowCount: number;
  unitLabel: string;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SnapshotCell
        label="Current modal"
        value={
          guidance.latestModalPrice !== undefined
            ? `${formatInr(guidance.latestModalPrice)} / ${unitLabel}`
            : "—"
        }
      />
      <SnapshotCell
        label="Market range"
        value={
          guidance.observedRange?.min !== undefined &&
          guidance.observedRange.max !== undefined
            ? `${formatInr(guidance.observedRange.min)} – ${formatInr(guidance.observedRange.max)}`
            : "—"
        }
      />
      <SnapshotCell
        label="Trend"
        value={
          guidance.trend === "insufficient_data"
            ? "Insufficient data"
            : guidance.trend === "rising"
              ? `Rising ${absPercent(guidance.trendPercentage)}%`
              : guidance.trend === "falling"
                ? `Falling ${absPercent(guidance.trendPercentage)}%`
                : "Stable"
        }
        valueClass={
          guidance.trend === "rising"
            ? "text-success-fg"
            : guidance.trend === "falling"
              ? "text-danger-fg"
              : ""
        }
      />
      <SnapshotCell label="Markets" value={String(rowCount)} />
    </section>
  );
}

function SnapshotCell({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1.5 text-xl font-semibold tracking-tight ${valueClass ?? "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const tone =
    level === "high"
      ? "success"
      : level === "medium"
        ? "neutral"
        : level === "low" || level === "limited"
          ? "warning"
          : "outline";
  const label =
    level === "high"
      ? "High"
      : level === "medium"
        ? "Medium"
        : level === "low"
          ? "Low"
          : level === "limited"
            ? "Limited"
            : "Insufficient";
  return (
    <span className="text-sm text-muted-foreground">
      Confidence:{" "}
      <Badge tone={tone as "success" | "neutral" | "warning" | "outline"} className="ml-1">
        {label}
      </Badge>
    </span>
  );
}

function TrendSection({
  series,
  unit,
}: {
  series: Array<{ day: string; value: number }>;
  unit: string;
}) {
  if (series.length < 2) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-foreground">
        Not enough historical data to determine a trend.
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        Price trend
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Median modal price by arrival day (per {unitLabel(unit)}).
      </p>
      <TrendChart series={series} />
    </section>
  );
}

function TrendChart({ series }: { series: Array<{ day: string; value: number }> }) {
  const width = 560;
  const height = 120;
  const pad = 6;
  const values = series.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = series.map((point, index) => {
    const x = pad + (index / Math.max(1, series.length - 1)) * (width - pad * 2);
    const y = height - pad - ((point.value - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const arrowIcon =
    series[series.length - 1].value >= series[0].value ? "up" : "down";

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/40">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Trend of median modal prices by arrival date"
        className="h-28 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
        <span>{formatShortDate(series[0].day)}</span>
        <span className="inline-flex items-center gap-1 font-medium">
          {arrowIcon === "up" ? (
            <ArrowUp className="size-3.5 text-success-fg" />
          ) : (
            <ArrowDown className="size-3.5 text-danger-fg" />
          )}
          {formatInr(min)} → {formatInr(max)}
        </span>
        <span>{formatShortDate(series[series.length - 1].day)}</span>
      </div>
    </div>
  );
}

function latestPerMarket(records: MarketPriceView[]): MarketRowItem[] {
  const byMarket = new Map<string, MarketPriceView>();
  for (const record of records) {
    const existing = byMarket.get(record.market);
    const existingArrival = existing?.arrivalDate ?? "";
    const recordArrival = record.arrivalDate ?? "";
    if (!existing || recordArrival > existingArrival) {
      byMarket.set(record.market, record);
    }
  }
  return Array.from(byMarket.values()).map((record) => ({
    market: record.market,
    district: record.district,
    state: record.state,
    variety: record.variety,
    grade: record.grade,
    modalPrice: record.modalPrice,
    minPrice: record.minPrice,
    maxPrice: record.maxPrice,
    arrivalDate: record.arrivalDate,
    fetchedAt: record.fetchedAt,
    source: record.source,
  }));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatInr(value: number): string {
  return inr.format(value);
}

function unitLabel(unit: string): string {
  if (unit === "kg") return "Kg";
  if (unit === "tonne") return "Tonne";
  return "Quintal";
}

function absPercent(value: number | undefined): string {
  return value === undefined ? "" : Math.abs(value).toFixed(1);
}

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000));
  return hours < 1 ? "just now" : hours < 24 ? `${hours}h ago` : formatShortDate(iso);
}

function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
