"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Sprout, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchProduceListings, fetchFarmerOrders } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { ScreenSkeleton } from "@/components/dashboard/screen-skeleton";
import { getJson } from "@/lib/client/fetch-json";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface FarmerProfile {
  bio?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function FarmerProfilePage() {
  const session = useSessionUser();
  const userId = session.data?.id;
  const user = session.data;

  const profileQuery = useQuery({
    queryKey: ["kv", "farmer", userId ?? "", "profile"],
    queryFn: () => getJson<{ profile: FarmerProfile }>("/api/profile"),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId),
  });

  const produceQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").produce,
    queryFn: () => fetchProduceListings(),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId),
  });

  const ordersQuery = useQuery({
    queryKey: kvKeys.farmer(userId ?? "").orders(1),
    queryFn: () => fetchFarmerOrders(1),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId),
  });

  if (!userId) {
    return <ScreenSkeleton maxWidth="max-w-4xl" />;
  }

  const profile = profileQuery.data?.profile;
  const activeProduce = produceQuery.data?.length ?? 0;
  const totalOrders = ordersQuery.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/farmer"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Profile header */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
            <span aria-hidden="true">🌾</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {user?.fullName ?? "Farmer"}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Verified Farmer ✓
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <User className="size-4" />
          Personal Information
        </h2>
        <div className="mt-4 space-y-3">
          <InfoRow label="Name" value={user?.fullName} />
          <InfoRow label="Phone" value={user?.phone} />
          <InfoRow label="Email" value={user?.email} />
        </div>
      </div>

      {/* Farming Information */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Sprout className="size-4" />
          Farming Information
        </h2>
        <div className="mt-4 space-y-3">
          <InfoRow
            label="Location"
            value={
              [profile?.village, profile?.district, profile?.state]
                .filter(Boolean)
                .join(", ") || undefined
            }
          />
          <InfoRow label="PIN code" value={profile?.pincode} />
          {profile?.bio && (
            <div>
              <p className="text-xs text-muted-foreground">About</p>
              <p className="mt-0.5 text-sm text-foreground">{profile.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Activity */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-4" />
          Marketplace Activity
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Active Produce" value={activeProduce} />
          <StatCard label="Orders" value={totalOrders} />
          <StatCard label="Completed Deals" value="—" hint="Coming soon" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground text-right">
        {value || "—"}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">{hint}</p>
      )}
    </div>
  );
}
