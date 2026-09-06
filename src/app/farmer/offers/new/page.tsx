import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Rocket } from "lucide-react";
import { EmptyState, linkButtonClass } from "@/components/ui";
import Link from "next/link";
import { OfferForm } from "@/components/offers/offer-form";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getFarmerRequirementMatches } from "@/features/matching/matching-service";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Make an offer",
};

export const dynamic = "force-dynamic";

export default async function NewOfferPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const params = await searchParams;
  const produceId = firstString(params.produceId);
  const requirementId = firstString(params.requirementId);

  if (
    !produceId ||
    !requirementId ||
    !objectIdSchema.safeParse(produceId).success ||
    !objectIdSchema.safeParse(requirementId).success
  ) {
    notFound();
  }

  const profileId = await getFarmerProfileRecordId(user.id);
  const produce = profileId
    ? await getFarmerProduceListing(produceId, profileId)
    : null;
  if (!produce) {
    notFound();
  }

  const result = profileId
    ? await getFarmerRequirementMatches(requirementId, profileId)
    : null;
  if (!result) {
    notFound();
  }

  const requirement = result.requirement;

  if (produce.status !== "active") {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={<Rocket className="size-6" />}
          title="Publish this crop first"
          description="Only published produce can be offered to buyers. Publish your crop, then come back to make this offer."
          action={
            <Link href={`/farmer/produce/${produce.id}`} className={linkButtonClass("primary", "lg")}>
              Go to this crop
            </Link>
          }
        />
      </div>
    );
  }

  if (requirement.status !== "active") {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="This requirement is no longer active"
          description="Offers can only be made against an active buying requirement. Look for other buyers who need your crop."
          action={
            <Link href={`/farmer/requirements/${requirement.id}`} className={linkButtonClass("outline", "lg")}>
              Back to the requirement
            </Link>
          }
        />
      </div>
    );
  }

  if (requirement.remainingQuantity <= 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          icon={<CheckCircle2 className="size-6" />}
          title="This requirement is fully fulfilled"
          description="The buyer has already committed the full quantity through accepted offers, so no more offers can be made against it."
          action={
            <Link href="/farmer/requirements" className={linkButtonClass("primary", "lg")}>
              See other buyer requirements
            </Link>
          }
        />
      </div>
    );
  }

  const defaultQuantity = Math.min(
    produce.quantity,
    requirement.remainingQuantity,
  );

  return (
    <OfferForm
      produce={{
        id: produce.id,
        cropName: produce.cropName,
        cropEmoji: produce.cropEmoji,
        variety: produce.variety,
        quantity: produce.quantity,
        unitLabel: produce.unitLabel,
        askingPricePerUnit: produce.askingPrice,
        locationText: produce.locationText || undefined,
      }}
      requirement={{
        id: requirement.id,
        cropName: requirement.cropName,
        quantity: requirement.quantity,
        unitLabel: requirement.unitLabel,
        remainingQuantity: requirement.remainingQuantity,
        targetPriceMin: requirement.targetPriceMin,
        targetPriceMax: requirement.targetPriceMax,
        requiredBy: requirement.requiredBy,
        vendor: requirement.vendor,
      }}
      defaultQuantity={defaultQuantity}
    />
  );
}

function firstString(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] : undefined;
}