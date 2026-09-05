import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BuyerRequirementView } from "@/features/buyer-requirements/types";
import { RequirementStatusBadge } from "./requirement-status-badge";
import { RequirementFacts } from "./requirement-facts";

function formatCreated(iso: string): string {
  if (!iso) {
    return "recently";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function RequirementCard({
  requirement,
  href,
}: {
  requirement: BuyerRequirementView;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
            <span aria-hidden="true">{requirement.cropEmoji ?? "🌾"}</span>
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
              {requirement.cropName}
            </h3>
            {requirement.variety ? (
              <p className="truncate text-sm text-muted-foreground">
                {requirement.variety}
              </p>
            ) : null}
          </div>
        </div>
        <RequirementStatusBadge status={requirement.status} className="shrink-0" />
      </div>

      <RequirementFacts
        className="mt-4 flex-1"
        quantity={requirement.quantity}
        unitLabel={requirement.unitLabel}
        qualityLabel={requirement.qualityLabel}
        targetPriceMin={requirement.targetPriceMin}
        targetPriceMax={requirement.targetPriceMax}
        locationText={requirement.locationText || undefined}
        requiredBy={requirement.requiredBy}
        notes={requirement.status === "active" ? requirement.notes : undefined}
      />

      <p className="mt-3 text-xs text-muted-foreground">
        Posted {formatCreated(requirement.createdAt)}
      </p>

      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
        View requirement
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
