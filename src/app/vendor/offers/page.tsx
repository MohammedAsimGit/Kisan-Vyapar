"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { OfferCard } from "@/components/offers/offer-card";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchVendorOffers } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";

export default function VendorOffersPage() {
  return (
    <Suspense fallback={<ScreenSkeleton maxWidth="max-w-4xl" />}>
      <VendorOffersContent />
    </Suspense>
  );
}

function VendorOffersContent() {
  const searchParams = useSearchParams();
  const page = readPage(searchParams.get("page"));
  const requirementId = searchParams.get("requirementId") ?? undefined;

  const session = useSessionUser();
  const userId = session.data?.id;

  const offersQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").offers(page, requirementId),
    queryFn: () => fetchVendorOffers(page, requirementId),
    staleTime: DYNAMIC_STALE_TIME,
    placeholderData: keepPreviousData,
    enabled: Boolean(userId),
  });

  if (!userId) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }
  if (offersQuery.isPending) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }
  if (offersQuery.isError) {
    return (
      <ScreenError
        onRetry={() => void offersQuery.refetch()}
        description="We couldn't load your offers right now. Please try again in a moment."
      />
    );
  }

  const result = offersQuery.data;
  const linkForPage = (nextPage: number) =>
    `/vendor/offers?page=${nextPage}${requirementId ? `&requirementId=${requirementId}` : ""}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Negotiations"
        title="Offers from farmers"
        description="Real offers on your buying requirements — respond by accepting, countering or rejecting."
      />

      {result.meta.total === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title="No offers yet"
          description="Farmer offers will appear here when they respond to your buying requirements."
          action={
            <Link
              href="/vendor/requirements"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              View your requirements
            </Link>
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {result.meta.total}{" "}
            {result.meta.total === 1 ? "offer" : "offers"}
          </p>
          <div className="space-y-3">
            {result.offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                role="vendor"
                href={`/vendor/offers/${offer.id}`}
              />
            ))}
          </div>

          {result.meta.totalPages > 1 ? (
            <nav aria-label="Offer pages" className="flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link
                  href={linkForPage(page - 1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-muted-foreground">
                Page {result.meta.page} of {result.meta.totalPages}
              </span>
              {page < result.meta.totalPages ? (
                <Link
                  href={linkForPage(page + 1)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

function readPage(raw: string | null): number {
  const value = Number(raw ?? "1");
  return Number.isInteger(value) && value >= 1 ? value : 1;
}