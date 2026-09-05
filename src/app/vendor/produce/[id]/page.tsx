import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui";
import { ListingFacts } from "@/components/matching/listing-facts";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { objectIdSchema } from "@/lib/validation";
import { getPublishedProduceListing } from "@/features/produce/produce-service";

export const metadata: Metadata = {
  title: "Farmer produce listing",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function VendorProduceViewPage({ params }: RouteContext) {
  await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const published = await getPublishedProduceListing(id);
  if (!published) {
    notFound();
  }

  const { listing, farmerName } = published;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/vendor/requirements"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to Buying Requirements
      </Link>

      <PageHeader
        eyebrow="Published produce"
        title={listing.cropName}
        description={`A real, published farmer listing that matches one of your requirements.`}
        actions={
          <Badge tone="success" className="px-3 py-1.5">
            Published
          </Badge>
        }
      />

      <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <ListingFacts
          cropName={listing.cropName}
          cropEmoji={listing.cropEmoji}
          variety={listing.variety}
          quantity={listing.quantity}
          unitLabel={listing.unitLabel}
          qualityLabel={listing.qualityLabel}
          askingPricePerUnit={listing.askingPrice}
          locationText={listing.locationText || undefined}
          expectedHarvestDate={listing.expectedHarvestDate}
          farmerName={farmerName}
        />

        <p className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
          <BadgeCheck className="size-4 shrink-0 text-primary" />
          {farmerName
            ? `This listing belongs to ${farmerName}. Negotiation and orders arrive in the next update — reach out through a future offer flow.`
            : "This listing is published by a farmer. Negotiation and orders arrive in the next update."}
        </p>
      </section>
    </div>
  );
}
