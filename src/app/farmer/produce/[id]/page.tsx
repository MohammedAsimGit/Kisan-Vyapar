import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BarChart3, Handshake, Rocket } from "lucide-react";
import { Card, linkButtonClass, PageHeader } from "@/components/ui";
import { ProduceActions } from "@/components/produce/produce-actions";
import { ProduceStatusBadge } from "@/components/produce/produce-status-badge";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Crop details",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function ProduceDetailPage({ params }: RouteContext) {
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

  const status = listing.status;

  const rows: { label: string; value: string }[] = [
    { label: "Crop", value: listing.cropName },
    ...(listing.variety ? [{ label: "Variety", value: listing.variety }] : []),
    { label: "Quantity", value: `${listing.quantity} ${listing.unitLabel}` },
    { label: "Quality", value: listing.qualityLabel },
    {
      label: "Location",
      value: listing.locationText || "Not set",
    },
    {
      label: "Ready",
      value: listing.expectedHarvestDate
        ? formatDate(listing.expectedHarvestDate)
        : "Not set",
    },
    ...(listing.askingPrice !== undefined
      ? [
          {
            label: "Your asking price",
            value: `₹${formatPlain(listing.askingPrice)} / ${listing.unitLabel}`,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/farmer/produce"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to My Produce
      </Link>

      <PageHeader
        eyebrow="Crop details"
        title={listing.cropName}
        description={
          listing.locationText
            ? `${listing.quantity} ${listing.unitLabel} · ${listing.qualityLabel} · ${listing.locationText}`
            : `${listing.quantity} ${listing.unitLabel} · ${listing.qualityLabel}`
        }
        actions={<ProduceStatusBadge status={status} className="px-3 py-1.5" />}
      />

      <Card>
        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-6 py-3.5 first:pt-0 last:pb-0"
            >
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd className="text-right text-base font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <PublishStatusCard
        listingId={listing.id}
        cropName={listing.cropName}
        status={status}
        hasAskingPrice={listing.askingPrice !== undefined}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-primary-soft/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-primary-soft-fg">
            Understand today&apos;s market price
          </h2>
          <p className="mt-1 text-sm leading-6 text-primary-soft-fg/90">
            See observed mandi prices for {listing.cropName} and price guidance for
            your asking price.
          </p>
        </div>
        <Link
          href={`/farmer/produce/${listing.id}/prices`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <BarChart3 className="size-4" />
          View Market Intelligence
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/farmer/produce/${listing.id}/edit`}
          className={linkButtonClass("primary", "md")}
        >
          Edit Crop
        </Link>
        <ProduceActions listingId={listing.id} status={status} />
      </div>
    </div>
  );
}

function PublishStatusCard({
  listingId,
  cropName,
  status,
  hasAskingPrice,
}: {
  listingId: string;
  cropName: string;
  status: "draft" | "active" | "sold_out" | "withdrawn";
  hasAskingPrice: boolean;
}) {
  if (status === "active") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-success-border bg-success-bg/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-success-fg">
            <Handshake className="size-4" />
            Published — buyers can find this crop
          </h2>
          <p className="mt-1 text-sm leading-6 text-success-fg/90">
            Your {cropName.toLowerCase()} is compared against real buying
            requirements and ranked with a match score.
          </p>
        </div>
        <Link
          href={`/farmer/produce/${listingId}/matches`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Buyer requirements
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  if (status === "draft") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-warning-border bg-warning-bg/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-warning-fg">
            <Rocket className="size-4" />
            Draft — not yet published
          </h2>
          <p className="mt-1 text-sm leading-6 text-warning-fg/90">
            {hasAskingPrice
              ? "Ready to publish. Published crops appear in buyer matching."
              : "Set your asking price first (see Market Intelligence), then publish your crop to appear in buyer matching."}
          </p>
        </div>
        <Link
          href={`/farmer/produce/${listingId}/prices`}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-base font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {hasAskingPrice ? "Review asking price" : "Set asking price"}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-muted/60 p-5">
      <h2 className="text-base font-semibold tracking-tight">
        This crop is {status === "sold_out" ? "sold out" : "inactive"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Buyers cannot see this crop while it is not published. Reactivate it above
        when you are ready to sell.
      </p>
    </div>
  );
}

function formatDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatPlain(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}
