"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus } from "lucide-react";
import { EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { RequirementCard } from "@/components/requirements/requirement-card";
import { requirementStatusLabel } from "@/components/requirements/requirement-status-badge";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchVendorRequirements } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { LIST_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";

const DISPLAY_ORDER: BuyerRequirementStatus[] = [
  "active",
  "paused",
  "fulfilled",
  "expired",
  "cancelled",
];

export default function VendorRequirementsPage() {
  const session = useSessionUser();
  const userId = session.data?.id;

  const requirementsQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").requirements,
    queryFn: fetchVendorRequirements,
    staleTime: LIST_STALE_TIME,
    enabled: Boolean(userId),
  });

  if (!userId || requirementsQuery.isPending) {
    return <ScreenSkeleton />;
  }
  if (requirementsQuery.isError) {
    return (
      <ScreenError
        onRetry={() => void requirementsQuery.refetch()}
        description="We couldn't load your requirements right now. Please try again in a moment."
      />
    );
  }

  const result = requirementsQuery.data;

  const summary = result.counts
    ? DISPLAY_ORDER.filter((status) => result.counts![status] > 0)
        .map((status) => `${result.counts![status]} ${requirementStatusLabel(status).toLowerCase()}`)
        .join(" · ")
    : "";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Buying requirements"
        title="What you need to buy"
        description="Post what you want to purchase and matching published farmer produce will appear here."
        actions={
          <Link href="/vendor/requirements/new" className={linkButtonClass("primary", "md")}>
            <Plus className="size-4" />
            Post Buying Requirement
          </Link>
        }
      />

      {summary ? (
        <p className="text-sm text-muted-foreground">{summary}.</p>
      ) : null}

      {result.requirements.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-6" />}
          title="You haven't posted any buying requirements yet"
          description="Tell farmers exactly what you want to buy. Active requirements become visible to matching farmers."
          action={
            <Link href="/vendor/requirements/new" className={linkButtonClass("primary", "lg")}>
              <Plus className="size-4" />
              Post Buying Requirement
            </Link>
          }
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          {result.requirements.map((requirement) => (
            <RequirementCard
              key={requirement.id}
              requirement={requirement}
              href={`/vendor/requirements/${requirement.id}`}
            />
          ))}
        </section>
      )}
    </div>
  );
}