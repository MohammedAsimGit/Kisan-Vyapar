"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ClipboardList,
  Handshake,
  Package,
  Plus,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { Badge, EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { RequirementCard } from "@/components/requirements/requirement-card";
import { greetingForHour } from "@/lib/utils/greeting";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchVendorDashboard, fetchVendorProfile } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { LIST_STALE_TIME, STABLE_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";
import { cn } from "@/lib/utils/cn";

export default function VendorDashboardPage() {
  const session = useSessionUser();
  const userId = session.data?.id;

  const dashboardQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").dashboard,
    queryFn: fetchVendorDashboard,
    staleTime: LIST_STALE_TIME,
    enabled: Boolean(userId),
  });

  const profileQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").profile,
    queryFn: fetchVendorProfile,
    staleTime: STABLE_STALE_TIME,
    enabled: Boolean(userId),
  });

  if (!userId) {
    return <ScreenSkeleton />;
  }
  if (dashboardQuery.isPending || profileQuery.isPending) {
    return <ScreenSkeleton />;
  }
  if (dashboardQuery.isError || profileQuery.isError) {
    return (
      <ScreenError
        onRetry={() => {
          void dashboardQuery.refetch();
          void profileQuery.refetch();
        }}
        description="We couldn't load your dashboard right now. Please try again in a moment."
      />
    );
  }

  const { requirements, counts, pendingCounts } = dashboardQuery.data;
  const profile = profileQuery.data;
  const pendingOffers = Object.values(pendingCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const recent = requirements.slice(0, 3);

  const firstName = session.data?.fullName.split(/\s+/)[0] ?? "buyer";
  const business = profile?.businessName;
  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Vendor dashboard"
        title={`${greeting}, ${firstName}`}
        description="Here's what to focus on for your buying today."
        actions={
          <Link href="/vendor/requirements/new" className={linkButtonClass("primary", "md")}>
            <Plus className="size-4" />
            Post Buying Requirement
          </Link>
        }
      />

      {/* Sourcing hero — real data only */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-raised">
        <div className="bg-gradient-to-br from-accent-soft via-surface to-surface p-7 sm:p-9">
          <div className="max-w-3xl">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-white shadow-sm">
              <Store className="size-6" />
            </span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/80">
              Buying requirements
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Tell farmers what you want to buy.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Post a requirement and matching published farmer produce is ranked
              for it — with an honest, explainable match score. No demo buyers, no
              invented matches.
            </p>
          </div>

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Active" value={counts.active} />
            <Stat label="Paused" value={counts.paused} />
            <Stat label="Fulfilled" value={counts.fulfilled} />
            <Stat label="New offers" value={pendingOffers} />
          </dl>

          {pendingOffers > 0 ? (
            <Link
              href="/vendor/offers"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-soft/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Handshake className="size-4" />
              {pendingOffers} pending {pendingOffers === 1 ? "offer" : "offers"} waiting — respond now
            </Link>
          ) : null}
        </div>
      </section>

      {/* Recent requirements */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your requirements</h2>
            <p className="text-sm text-muted-foreground">
              {recent.length > 0
                ? `Showing your ${recent.length === 1 ? "latest requirement" : "latest requirements"} — all real.`
                : "Everything you post appears here."}
            </p>
          </div>
          <Link
            href="/vendor/requirements"
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="You haven't posted any buying requirements yet"
            description="Active requirements are matched against real published farmer produce. There are never fake listings here."
            action={
              <Link href="/vendor/requirements/new" className={linkButtonClass("primary", "lg")}>
                <Plus className="size-4" />
                Post Buying Requirement
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((requirement) => (
              <RequirementCard
                key={requirement.id}
                requirement={requirement}
                href={`/vendor/requirements/${requirement.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Setup checklist */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h2 className="text-lg font-semibold tracking-tight">Ready to source</h2>
          <ul className="mt-4 space-y-3">
            <SetupRow
              done
              label="Business profile complete"
              detail={
                business
                  ? `${business}${locationText ? ` · ${locationText}` : ""}`
                  : "Buying with Kisan Vyapar"
              }
            />
            <SetupRow
              done={counts.active > 0}
              label="Post your first requirement"
              detail={
                counts.active > 0
                  ? `${counts.active} active requirement${counts.active === 1 ? "" : "s"} matching farmer produce`
                  : "Post what you need to buy and matching farmers will appear"
              }
            />
            <SetupRow
              done={pendingOffers > 0}
              label="Match and negotiate"
              detail={
                pendingOffers > 0
                  ? `${pendingOffers} pending ${pendingOffers === 1 ? "offer" : "offers"} — respond from the Offers tab`
                  : "Farmers can send you offers — respond from the Offers tab"
              }
            />
          </ul>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 p-6 text-center">
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            {counts.active > 0
              ? "Open a requirement to see the farmers whose published produce can supply it — scored by crop, quality, quantity, price, location and timing."
              : "No active requirements yet. Farmers will only appear against requirements you actually post — we never show numbers we don't really have."}
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionLink
            href="/vendor/requirements"
            icon={<ClipboardList className="size-5" />}
            title="Requirements"
            body="Manage what you want to buy."
          />
          <QuickActionLink
            href="/vendor/offers"
            icon={<Handshake className="size-5" />}
            title="Offers"
            body="Respond to farmers negotiating on your requirements."
          />
          <QuickAction
            icon={<Package className="size-5" />}
            title="Orders"
            body="Track purchases from offer to delivery."
          />
          <QuickAction
            icon={<Truck className="size-5" />}
            title="Procurement"
            body="Keep sourcing reliable and on time."
          />
        </div>
      </section>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="size-4 text-accent-foreground" />
        A match score is not a price promise — it compares real supply with real
        demand so you can decide what to negotiate.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function SetupRow({
  label,
  detail,
  done = false,
  pending = false,
}: {
  label: string;
  detail: string;
  done?: boolean;
  pending?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3.5",
        done ? "border-success-border bg-success-bg/60" : "border-border bg-background",
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
          done
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        {done ? (
          <Check className="size-3.5" />
        ) : (
          <span aria-hidden="true" className="size-2 rounded-full bg-border-strong" />
        )}
      </span>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", done ? "text-success-fg" : "text-foreground")}>
          {label}
          {pending ? (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Next
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      </div>
    </li>
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