"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Store } from "lucide-react";
import { Button, EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { BuyerMatchCard } from "@/components/matching/buyer-match-card";
import { useSessionUser } from "@/lib/client/use-session-user";
import {
  fetchFarmerRequirementDigest,
  fetchProduceListings,
} from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME, LIST_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";
import type { MatchFilter } from "@/features/matching/types";
import { cn } from "@/lib/utils/cn";

const FILTER_OPTIONS: Array<{ value: MatchFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "strong", label: "Strong matches" },
  { value: "price", label: "Price compatible" },
  { value: "quality", label: "Quality compatible" },
  { value: "nearby", label: "Nearby" },
];

const SORT_OPTIONS: Array<{ value: "score" | "deadline" | "nearest"; label: string }> = [
  { value: "score", label: "Best match" },
  { value: "deadline", label: "Needed soon" },
  { value: "nearest", label: "Nearest" },
];

export default function FarmerRequirementsPage() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <FarmerRequirementsContent />
    </Suspense>
  );
}

function FarmerRequirementsContent() {
  const searchParams = useSearchParams();
  const filter = readFilter(searchParams.get("filter"));
  const sort = readSort(searchParams.get("sort"));
  const page = readPage(searchParams.get("page"));

  const session = useSessionUser();
  const userId = session.data?.id;

  const listingsQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").produce,
    queryFn: fetchProduceListings,
    staleTime: LIST_STALE_TIME,
    enabled: Boolean(userId),
  });

  const digestQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").requirements({ page, filter, sort }),
    queryFn: () => fetchFarmerRequirementDigest({ page, filter, sort }),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId),
  });

  if (!userId) {
    return <ScreenSkeleton />;
  }
  if (listingsQuery.isPending || digestQuery.isPending) {
    return <ScreenSkeleton />;
  }
  if (listingsQuery.isError || digestQuery.isError) {
    return (
      <ScreenError
        onRetry={() => {
          void listingsQuery.refetch();
          void digestQuery.refetch();
        }}
        description="We couldn't load buyer requirements right now. Please try again in a moment."
      />
    );
  }

  const published = listingsQuery.data.filter(
    (listing) => listing.status === "active",
  ).length;
  const result = digestQuery.data;

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
      ) : result.matches.length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="No matching buyer requirements yet"
          description="Buyers will appear here when they post requirements that fit your published produce."
        />
      ) : (
        <>
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
            role="group"
            aria-label="Filter and sort matches"
          >
            {FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={filter === option.value}
                href={hrefFor({ filter: option.value, sort, page: 1 })}
              >
                {option.label}
              </FilterChip>
            ))}
            <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                active={sort === option.value}
                href={hrefFor({ filter, sort: option.value, page: 1 })}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            {result.meta.total} {result.meta.total === 1 ? "match" : "matches"} across your published crops.
          </p>

          <div className="space-y-3">
            {result.matches.map((row) => (
              <BuyerMatchCard
                key={`${row.listing.id}-${row.requirement.id}`}
                listing={row.listing}
                requirement={row.requirement}
                match={row.match}
                ctas={[
                  {
                    href: `/farmer/requirements/${row.requirement.id}`,
                    label: "View requirement",
                    variant: "primary",
                    arrow: true,
                  },
                  {
                    href: `/farmer/produce/${row.listing.id}/matches`,
                    label: "All matches for this crop",
                    variant: "outline",
                  },
                ]}
              />
            ))}
          </div>

          <PaginationBar
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            hrefFor={(nextPage) => hrefFor({ filter, sort, page: nextPage })}
          />
        </>
      )}
    </div>
  );
}

function readFilter(raw: string | null): MatchFilter {
  if (
    raw === "strong" ||
    raw === "price" ||
    raw === "quality" ||
    raw === "nearby"
  ) {
    return raw;
  }
  return "all";
}

function readSort(raw: string | null): "score" | "deadline" | "nearest" {
  if (raw === "deadline" || raw === "nearest") {
    return raw;
  }
  return "score";
}

function readPage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isInteger(value) && value >= 1 ? value : 1;
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
        "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
  filter,
  sort,
  page,
}: {
  filter: MatchFilter;
  sort: "score" | "deadline" | "nearest";
  page: number;
}): string {
  const params = new URLSearchParams({
    page: String(page),
    filter,
    sort,
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