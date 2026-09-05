import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin, Plus, Sprout } from "lucide-react";
import { EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { ProduceStatusBadge } from "@/components/produce/produce-status-badge";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import {
  getFarmerProduceListings,
} from "@/features/produce/produce-service";
import type { ProduceListingView } from "@/features/produce/types";

export const metadata: Metadata = {
  title: "My Produce",
};

export const dynamic = "force-dynamic";

export default async function FarmerProducePage() {
  const user = await requirePageUser();
  const profileId = await getFarmerProfileRecordId(user.id);
  const listings = profileId ? await getFarmerProduceListings(profileId) : [];
  const activeCount = listings.filter((listing) => listing.status === "active").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="My Produce"
        title="The crops you grow"
        description="Tell us what you've grown. We'll use it to help you understand the market for your crop."
        actions={
          <Link href="/farmer/produce/new" className={linkButtonClass("primary", "md")}>
            <Plus className="size-4" />
            Add Crop
          </Link>
        }
      />

      {activeCount > 0 ? (
        <p className="text-sm text-muted-foreground">
          {activeCount} {activeCount === 1 ? "published crop" : "published crops"}
          {listings.length > activeCount
            ? ` · ${listings.length - activeCount} not published`
            : ""}
          .
        </p>
      ) : null}

      {listings.length === 0 ? (
        <EmptyState
          icon={<Sprout className="size-6" />}
          title="Nothing added yet"
          description="Tell us what you've grown and we'll help you understand the market price."
          action={
            <Link href="/farmer/produce/new" className={linkButtonClass("primary", "lg")}>
              <Plus className="size-4" />
              Add Your Crop
            </Link>
          }
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <ProduceCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}
    </div>
  );
}

function ProduceCard({ listing }: { listing: ProduceListingView }) {
  return (
    <Link
      href={`/farmer/produce/${listing.id}`}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
            <span aria-hidden="true">{listing.cropEmoji ?? "🌱"}</span>
          </span>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {listing.cropName}
            </h3>
            {listing.variety ? (
              <p className="text-sm text-muted-foreground">{listing.variety}</p>
            ) : null}
          </div>
        </div>
        <ProduceStatusBadge status={listing.status} />
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground">
          <span className="font-medium">
            {listing.quantity} {listing.unitLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-muted-foreground">{listing.qualityLabel}</span>
        </div>
        {listing.locationText ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-3.5" />
            {listing.locationText}
          </div>
        ) : null}
        {listing.expectedHarvestDate ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Ready: {formatReadableDate(listing.expectedHarvestDate)}
          </div>
        ) : null}
      </dl>

      <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
        View crop
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}

function formatReadableDate(dateOnly: string): string {
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
