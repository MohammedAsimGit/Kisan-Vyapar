import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { EmptyState, linkButtonClass, PageHeader } from "@/components/ui";
import { RequirementCard } from "@/components/requirements/requirement-card";
import { requirementStatusLabel } from "@/components/requirements/requirement-status-badge";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";
import type { BuyerRequirementStatus } from "@/constants/buyer-requirement-statuses";
import { listVendorRequirements } from "@/features/buyer-requirements/buyer-requirement-service";

export const metadata: Metadata = {
  title: "Buying requirements",
};

export const dynamic = "force-dynamic";

const DISPLAY_ORDER: BuyerRequirementStatus[] = [
  "active",
  "paused",
  "fulfilled",
  "expired",
  "cancelled",
];

export default async function VendorRequirementsPage() {
  const user = await requirePageUser();
  const vendorProfileId = await getVendorProfileRecordId(user.id);
  const result = vendorProfileId
    ? await listVendorRequirements(vendorProfileId)
    : { requirements: [], counts: null };

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
