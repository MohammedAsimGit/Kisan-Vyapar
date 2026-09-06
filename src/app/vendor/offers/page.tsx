import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { OfferCard } from "@/components/offers/offer-card";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";
import { listVendorOffers } from "@/features/offers/offer-service";
import { offerListQuerySchema } from "@/features/offers/schemas";
import { readSearchParams } from "@/features/matching/query-schema";

export const metadata: Metadata = {
  title: "Offers",
};

export const dynamic = "force-dynamic";

export default async function VendorOffersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const profileId = await getVendorProfileRecordId(user.id);

  const params = await searchParams;
  const urlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      urlSearchParams.set(key, value);
    } else if (Array.isArray(value) && value.length > 0) {
      urlSearchParams.set(key, value[0]);
    }
  }
  const query = offerListQuerySchema.parse(readSearchParams(urlSearchParams));

  const result = profileId
    ? await listVendorOffers(profileId, query)
    : { offers: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

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
              {query.page > 1 ? (
                <Link
                  href={`/vendor/offers?page=${query.page - 1}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-muted-foreground">
                Page {result.meta.page} of {result.meta.totalPages}
              </span>
              {query.page < result.meta.totalPages ? (
                <Link
                  href={`/vendor/offers?page=${query.page + 1}`}
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