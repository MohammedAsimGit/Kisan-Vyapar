import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Package,
  Plus,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge, linkButtonClass, PageHeader } from "@/components/ui";
import { greetingForHour } from "@/lib/utils/greeting";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListings } from "@/features/produce/produce-service";
import type { ProduceListingView } from "@/features/produce/types";

export const metadata: Metadata = {
  title: "Farmer dashboard",
};

export const dynamic = "force-dynamic";

export default async function FarmerDashboardPage() {
  const user = await requirePageUser();
  const profileId = await getFarmerProfileRecordId(user.id);
  const listings = profileId ? await getFarmerProduceListings(profileId) : [];
  const active = listings.filter((listing) => listing.status === "active");
  const recent = listings.slice(0, 3);

  const firstName = user.fullName.split(/\s+/)[0] ?? user.fullName;
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Farmer dashboard"
        title={`${greeting}, ${firstName}`}
        description="Here's what matters for your farm today."
        actions={
          <Link href="/farmer/produce/new" className={linkButtonClass("primary", "md")}>
            <Plus className="size-4" />
            Add Crop
          </Link>
        }
      />

      {/* My crops — real data from MongoDB */}
      <section className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg">
              <Sprout className="size-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {active.length > 0
                  ? `${active.length} ${active.length === 1 ? "crop" : "crops"} ready to sell`
                  : "My crops"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {listings.length === 0
                  ? "Tell us what you've grown and we'll help you understand the market price."
                  : `${listings.length} ${listings.length === 1 ? "listing" : "listings"} total`}
              </p>
            </div>
          </div>
          <Link
            href="/farmer/produce"
            className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View My Produce
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-6 py-10 text-center">
            <Sprout className="size-8 text-primary" />
            <p className="mt-3 font-medium">You haven&apos;t added any crops yet.</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first crop and we&apos;ll show its market opportunity here.
            </p>
            <Link href="/farmer/produce/new" className={linkButtonClass("primary", "md", "mt-5")}>
              <Plus className="size-4" />
              Add Your Crop
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {recent.map((listing) => (
              <li key={listing.id}>
                <CropRow listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Market opportunity (planned, honest) */}
      <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-raised sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_85%_20%,white_0,transparent_40%),radial-gradient(circle_at_10%_100%,white_0,transparent_35%)]"
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">
              <TrendingUp className="size-4" />
              Market opportunity
            </p>
            <p className="mt-2 text-base leading-7 text-primary-foreground/90 sm:text-lg">
              Today&apos;s market price for your crops will appear here in an
              upcoming update.
            </p>
          </div>
          <Badge tone="outline" className="w-fit border-white/25 bg-white/10 text-white">
            Planned
          </Badge>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionLink
            href="/farmer/produce"
            icon={<Package className="size-5" />}
            title="My Produce"
            body="Manage the crops you grow."
          />
          <QuickAction
            icon={<TrendingUp className="size-5" />}
            title="Today's Prices"
            body="See real market context for your crops."
          />
          <QuickAction
            icon={<Users className="size-5" />}
            title="Find Buyers"
            body="Discover buyers looking for your produce."
          />
          <QuickAction
            icon={<ClipboardList className="size-5" />}
            title="My Orders"
            body="Track every sale from offer to payment."
          />
        </div>
      </section>
    </div>
  );
}

function CropRow({ listing }: { listing: ProduceListingView }) {
  return (
    <Link
      href={`/farmer/produce/${listing.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-xl">
        <span aria-hidden="true">{listing.cropEmoji ?? "🌱"}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{listing.cropName}</p>
        <p className="truncate text-sm text-muted-foreground">
          {listing.quantity} {listing.unitLabel} · {listing.qualityLabel}
        </p>
      </div>
      {listing.expectedHarvestDate ? (
        <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          <CalendarDays className="size-3.5" />
          {shortDate(listing.expectedHarvestDate)}
        </span>
      ) : null}
      <Badge tone={listing.status === "active" ? "success" : "outline"}>
        {listing.status === "active" ? "Active" : "Inactive"}
      </Badge>
    </Link>
  );
}

function QuickAction({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
        {icon}
      </span>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <Badge tone="outline">Soon</Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

function QuickActionLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-surface p-6 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </Link>
  );
}

function shortDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
