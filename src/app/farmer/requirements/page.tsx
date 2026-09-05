import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sprout, Store } from "lucide-react";
import { Button, EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { RequirementFacts } from "@/components/requirements/requirement-facts";
import { MatchExplain } from "@/components/matching/match-score";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerRequirementDigest } from "@/features/matching/matching-service";
import { matchQueryFromPageParams } from "@/features/matching/query-schema";
import type { MatchQuery } from "@/features/matching/query-schema";
import type { MatchFilter } from "@/features/matching/types";
import { cn } from "@/lib/utils/cn";
import { getFarmerProduceListings } from "@/features/produce/produce-service";

export const metadata: Metadata = {
  title: "Buyer requirements",
};

export const dynamic = "force-dynamic";

const FILTER_OPTIONS: Array<{ value: MatchFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "strong", label: "Strong matches" },
  { value: "price", label: "Price compatible" },
  { value: "quality", label: "Quality compatible" },
  { value: "nearby", label: "Nearby" },
];

const SORT_OPTIONS: Array<{ value: MatchQuery["sort"]; label: string }> = [
  { value: "score", label: "Best match" },
  { value: "deadline", label: "Needed soon" },
  { value: "nearest", label: "Nearest" },
];

export default async function FarmerRequirementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const profileId = await getFarmerProfileRecordId(user.id);
  const listings = profileId ? await getFarmerProduceListings(profileId) : [];
  const published = listings.filter((listing) => listing.status === "active").length;

  const query = await matchQueryFromPageParams(searchParams);
  const result = profileId
    ? await getFarmerRequirementDigest(profileId, query)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Buyer requirements"
        title="Real buyers looking for your crops"
        description="Requirements below come from real vendors who posted what they want to buy — matched only against your published produce."
      />

      {published === 0 ? (
        <EmptyState
          icon={<Sprout className="size-6" />}
          title="Publish produce to see buyer requirements"
          description="You don't have any published crops yet. Publish a crop and active buying requirements for it will appear here."
          action={
            <Link href="/farmer/produce" className={linkButtonClass("primary", "lg")}>
              Go to My Produce
            </Link>
          }
        />
      ) : result && result.matches.length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="No matching buyer requirements yet"
          description="Buyers will appear here when they post requirements that fit your published produce."
        />
      ) : result ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter matches">
              {FILTER_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  active={query.filter === option.value}
                  href={hrefFor({ query, filter: option.value, page: 1 })}
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
                  href={hrefFor({ query, sort: option.value, page: 1 })}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {result.meta.total} {result.meta.total === 1 ? "match" : "matches"} across your published crops.
          </p>

          <div className="space-y-4">
            {result.matches.map((row) => (
              <div
                key={`${row.listing.id}-${row.requirement.id}`}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                        <Sprout className="size-4 text-primary" />
                        Your {row.listing.cropName}
                      </span>
                      <span className="text-muted-foreground">
                        {row.listing.quantity} {row.listing.unitLabel} · {row.listing.qualityLabel}
                        {row.listing.locationText ? ` · ${row.listing.locationText}` : ""}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {row.requirement.vendor?.businessName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <Store className="size-4 text-primary" />
                          {row.requirement.vendor.businessName}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">A buyer</span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        needs {row.requirement.quantity} {row.requirement.unitLabel} of {row.requirement.cropName}
                      </span>
                    </div>

                    <RequirementFacts
                      className="mt-4"
                      quantity={row.requirement.quantity}
                      unitLabel={row.requirement.unitLabel}
                      qualityLabel={row.requirement.qualityLabel}
                      targetPriceMin={row.requirement.targetPriceMin}
                      targetPriceMax={row.requirement.targetPriceMax}
                      locationText={row.requirement.locationText}
                      requiredBy={row.requirement.requiredBy}
                      notes={row.requirement.notes}
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/farmer/requirements/${row.requirement.id}`}
                        className={linkButtonClass("primary", "md")}
                      >
                        View requirement
                        <ArrowRight className="size-4" />
                      </Link>
                      <Link
                        href={`/farmer/produce/${row.listing.id}/matches`}
                        className={linkButtonClass("outline", "md")}
                      >
                        All matches for this crop
                      </Link>
                    </div>
                  </div>
                  <MatchExplain match={row.match} className="lg:shrink-0 lg:flex-col-reverse lg:gap-3" />
                </div>
              </div>
            ))}
          </div>

          <PaginationBar
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            hrefFor={(page) => hrefFor({ query, page })}
          />
        </>
      ) : null}
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
  query,
  filter,
  sort,
  page,
}: {
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
  return `/farmer/requirements?${params.toString()}`;
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
