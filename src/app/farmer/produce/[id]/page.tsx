import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge, Card, linkButtonClass } from "@/components/ui";
import { ProduceActions } from "@/components/produce/produce-actions";
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

  const active = listing.status === "active";

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
            <span aria-hidden="true">{listing.cropEmoji ?? "🌱"}</span>
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {listing.cropName}
            </h1>
            {listing.locationText ? (
              <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                {listing.locationText}
              </p>
            ) : null}
          </div>
        </div>
        <Badge tone={active ? "success" : "outline"} className="self-start px-3 py-1.5">
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>

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

      <div className="rounded-2xl border border-border bg-primary-soft/50 p-5 text-sm leading-6 text-primary-soft-fg">
        Market price for this crop isn&apos;t shown yet. It will appear here once
        price discovery arrives in an upcoming update.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/farmer/produce/${listing.id}/edit`}
          className={linkButtonClass("primary", "md")}
        >
          Edit Crop
        </Link>
        <ProduceActions listingId={listing.id} active={active} />
      </div>
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
