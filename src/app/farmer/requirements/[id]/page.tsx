import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sprout, Store } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { RequirementStatusBadge } from "@/components/requirements/requirement-status-badge";
import { RequirementFacts } from "@/components/requirements/requirement-facts";
import { MatchExplain } from "@/components/matching/match-score";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { objectIdSchema } from "@/lib/validation";
import { getFarmerRequirementMatches } from "@/features/matching/matching-service";

export const metadata: Metadata = {
  title: "Buyer requirement",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function FarmerRequirementDetailPage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const profileId = await getFarmerProfileRecordId(user.id);
  const result = profileId
    ? await getFarmerRequirementMatches(id, profileId)
    : null;
  if (!result) {
    notFound();
  }

  const { requirement } = result;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/farmer/requirements"
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to Buyer Requirements
      </Link>

      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
              <span aria-hidden="true">{requirement.cropEmoji ?? "🌾"}</span>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {requirement.cropName}
                </h1>
                <RequirementStatusBadge status={requirement.status} className="px-3 py-1" />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
                {requirement.vendor?.businessName ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <Store className="size-4 text-primary" />
                    {requirement.vendor.businessName}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Store className="size-4 text-primary" />
                    A buyer
                  </span>
                )}
                <span>
                  needs {requirement.quantity} {requirement.unitLabel}
                </span>
              </p>
            </div>
          </div>
        </div>

        <RequirementFacts
          className="mt-6 border-t border-border pt-5"
          quantity={requirement.quantity}
          unitLabel={requirement.unitLabel}
          qualityLabel={requirement.qualityLabel}
          targetPriceMin={requirement.targetPriceMin}
          targetPriceMax={requirement.targetPriceMax}
          locationText={requirement.locationText}
          requiredBy={requirement.requiredBy}
          notes={requirement.notes}
        />
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Sprout className="size-5 text-primary" />
            Your produce that could supply this
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your published crops that match this requirement, scored honestly.
          </p>
        </div>

        {result.matches.length === 0 ? (
          <EmptyState
            icon={<Sprout className="size-6" />}
            title="No published produce matches this requirement yet"
            description="Publish a matching crop and it will be scored here against this requirement."
          />
        ) : (
          <div className="space-y-4">
            {result.matches.map((row) => (
              <div
                key={row.listing.id}
                className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      Your {row.listing.cropName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {row.listing.quantity} {row.listing.unitLabel} · {row.listing.qualityLabel}
                      {row.listing.askingPricePerUnit !== undefined
                        ? ` · asking ₹${row.listing.askingPricePerUnit} / ${row.listing.unitLabel}`
                        : " · no asking price set"}
                      {row.listing.locationText ? ` · ${row.listing.locationText}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/farmer/produce/${row.listing.id}/matches`}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        All buyer requirements for this crop
                      </Link>
                      <Button variant="outline" disabled title="Negotiation arrives in the next update">
                        Make Offer · Next update
                      </Button>
                    </div>
                  </div>
                  <MatchExplain match={row.match} className="lg:shrink-0 lg:flex-col-reverse lg:gap-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
