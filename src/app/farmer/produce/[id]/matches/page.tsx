import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Handshake, Store } from "lucide-react";
import { Badge, Button, EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { RequirementFacts } from "@/components/requirements/requirement-facts";
import { MatchExplain } from "@/components/matching/match-score";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { objectIdSchema } from "@/lib/validation";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getMatchesForProduceListing } from "@/features/matching/matching-service";
import { matchQueryFromPageParams } from "@/features/matching/query-schema";
import type { MatchQuery } from "@/features/matching/query-schema";
import type { MatchFilter } from "@/features/matching/types";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = {
  title: "Buyer requirements",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

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

export default async function ProduceMatchesPage({
  params,
  searchParams,
}: RouteContext & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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

  const query = await matchQueryFromPageParams(searchParams);

  const published = listing.status === "active";
  const result = published
    ? await getMatchesForProduceListing(id, profileId!, query)
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href={`/farmer/produce/${listing.id}`}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to {listing.cropName}
      </Link>

      <PageHeader
        eyebrow="Buyer requirements"
        title={`Buyers looking for ${listing.cropName}`}
        description={
          published
            ? `${listing.quantity} ${listing.unitLabel} · ${listing.qualityLabel} · ${listing.locationText || "location not set"}`
            : `Publish this crop to appear in buyer matching.`
        }
      />

      {!published ? (
        <EmptyState
          icon={<Handshake className="size-6" />}
          title="Publish this crop to see buyer requirements"
          description="Only published produce is matched against real buying requirements. Publish it from the crop page."
          action={
            <Link href={`/farmer/produce/${listing.id}`} className={linkButtonClass("primary", "lg")}>
              Go to this crop
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

          <p className="text-sm text-muted-foreground">
            {result.meta.total} {result.meta.total === 1 ? "buyer requirement" : "buyer requirements"} match your published{" "}
            {listing.cropName.toLowerCase()} listing.
          </p>

          <div className="space-y-4">
            {result.matches.map((row) => (
              <div
                key={row.requirement.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {row.requirement.vendor?.businessName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          <Store className="size-4 text-primary" />
                          {row.requirement.vendor.businessName}
                        </span>
                      ) : (
                        <Badge tone="outline">Buyer</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        needs {row.requirement.quantity} {row.requirement.unitLabel}
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
                      <Button variant="outline" disabled title="Negotiation arrives in the next update">
                        Make Offer · Next update
                      </Button>
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
            hrefFor={(page) => hrefFor({ id, query, page })}
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
  return `/farmer/produce/${id}/matches?${params.toString()}`;
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
