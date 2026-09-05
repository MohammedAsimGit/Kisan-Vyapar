import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Pencil, Users } from "lucide-react";
import { Badge, Button, EmptyState, linkButtonClass } from "@/components/ui";
import { RequirementStatusBadge } from "@/components/requirements/requirement-status-badge";
import { RequirementFacts } from "@/components/requirements/requirement-facts";
import { RequirementActions } from "@/components/requirements/requirement-actions";
import { ListingFacts } from "@/components/matching/listing-facts";
import { MatchExplain } from "@/components/matching/match-score";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";
import { objectIdSchema } from "@/lib/validation";
import { getOwnedBuyerRequirement } from "@/features/buyer-requirements/buyer-requirement-service";
import { getMatchesForRequirement } from "@/features/matching/matching-service";
import {
  matchQueryFromPageParams,
  MATCH_SORT_VALUES,
} from "@/features/matching/query-schema";

type MatchSort = (typeof MATCH_SORT_VALUES)[number];
import type { MatchQuery } from "@/features/matching/query-schema";
import type { MatchFilter } from "@/features/matching/types";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Buying requirement",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const FILTER_OPTIONS: Array<{ value: MatchFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "strong", label: "Strong matches" },
  { value: "quantity", label: "Quantity compatible" },
  { value: "price", label: "Price compatible" },
  { value: "nearby", label: "Nearby" },
];

const SORT_OPTIONS: Array<{ value: MatchSort; label: string }> = [
  { value: "score", label: "Best match" },
  { value: "nearest", label: "Nearest" },
];

export default async function VendorRequirementDetailPage({
  params,
  searchParams,
}: RouteContext & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const vendorProfileId = await getVendorProfileRecordId(user.id);
  const requirement = vendorProfileId
    ? await getOwnedBuyerRequirement(vendorProfileId, id)
    : null;
  if (!requirement) {
    notFound();
  }

  const query = await matchQueryFromPageParams(searchParams);
  const isActive = requirement.status === "active";
  const matches = isActive
    ? await getMatchesForRequirement(id, vendorProfileId!, query)
    : null;

  const editable = requirement.status === "active" || requirement.status === "paused";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/vendor/requirements"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to Buying Requirements
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
              <span aria-hidden="true">{requirement.cropEmoji ?? "🌾"}</span>
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {requirement.cropName}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {requirement.quantity} {requirement.unitLabel} needed
                {requirement.variety ? ` · ${requirement.variety}` : ""}
              </p>
            </div>
          </div>
          <RequirementStatusBadge status={requirement.status} className="self-start px-3 py-1.5" />
        </div>

        <RequirementFacts
          className="mt-6 border-t border-border pt-5"
          quantity={requirement.quantity}
          unitLabel={requirement.unitLabel}
          qualityLabel={requirement.qualityLabel}
          targetPriceMin={requirement.targetPriceMin}
          targetPriceMax={requirement.targetPriceMax}
          locationText={requirement.locationText || undefined}
          requiredBy={requirement.requiredBy}
          notes={requirement.notes}
        />

        <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Posted {formatDateOnly(requirement.createdAt)}
        </p>

        {editable ? (
          <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
            <RequirementActions requirementId={requirement.id} status={requirement.status} />
            <Link href={`/vendor/requirements/${requirement.id}/edit`} className={linkButtonClass("outline", "md", "self-start")}>
              <Pencil className="size-4" />
              Edit requirement
            </Link>
          </div>
        ) : null}
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Users className="size-5 text-primary" />
              Matching farmers
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {matches
                ? `${matches.meta.total} ${matches.meta.total === 1 ? "published farmer listing" : "published farmer listings"} match this requirement.`
                : "Only active requirements can see matching farmers."}
            </p>
          </div>
          {matches ? (
            <Badge tone="success" className="px-3 py-1.5">
              {matches.meta.total} found
            </Badge>
          ) : null}
        </div>

        {matches ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter matches">
                {FILTER_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={query.filter === option.value}
                    href={hrefFor({ id, query, filter: option.value, page: 1 })}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort matches">
                {SORT_OPTIONS.map((option) => (
                  <FilterChip
                    key={option.value}
                    active={query.sort === option.value}
                    href={hrefFor({ id, query, sort: option.value, page: 1 })}
                  >
                    {option.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            {matches.matches.length === 0 ? (
              <EmptyState
                icon={<Users className="size-6" />}
                title="No matching farmer produce yet"
                description="Published farmer listings will appear here when they match this requirement."
              />
            ) : (
              <div className="space-y-4">
                {matches.matches.map((row) => (
                  <div
                    key={row.listing.id}
                    className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <ListingFacts
                        className="min-w-0 flex-1"
                        cropName={row.listing.cropName}
                        cropEmoji={row.listing.cropEmoji}
                        variety={row.listing.variety}
                        quantity={row.listing.quantity}
                        unitLabel={row.listing.unitLabel}
                        qualityLabel={row.listing.qualityLabel}
                        askingPricePerUnit={row.listing.askingPricePerUnit}
                        locationText={row.listing.locationText}
                        expectedHarvestDate={row.listing.expectedHarvestDate}
                        farmerName={row.listing.farmer?.farmerName}
                      />
                      <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row lg:flex-col lg:items-end">
                        <MatchExplain match={row.match} className="lg:flex-row-reverse" />
                        <Link
                          href={`/vendor/produce/${row.listing.id}`}
                          className={linkButtonClass("outline", "md", "justify-center")}
                        >
                          View listing
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <PaginationBar
              page={matches.meta.page}
              totalPages={matches.meta.totalPages}
              hrefFor={(page) =>
                hrefFor({ id, query: { ...query, page, filter: query.filter, sort: query.sort }, page })
              }
            />
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-6 py-10 text-center text-sm leading-6 text-muted-foreground">
            {requirement.status === "paused"
              ? "This requirement is paused. Resume it to see matching farmers again."
              : "This requirement is no longer active, so matching farmers are not shown."}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function hrefFor({
  id,
  query,
  filter,
  sort,
  page,
}: {
  id: string;
  query: MatchQuery;
  filter?: MatchFilter;
  sort?: MatchQuery["sort"];
  page: number;
}): string {
  const params = new URLSearchParams({
    page: String(page),
    filter: filter ?? query.filter,
    sort: sort ?? query.sort,
  });
  return `/vendor/requirements/${id}?${params.toString()}`;
}

function PaginationBar({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav aria-label="Match pages" className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkButtonClass("outline", "sm")}>
          Previous
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={linkButtonClass("outline", "sm")}>
          Next
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      )}
    </nav>
  );
}

function formatDateOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
