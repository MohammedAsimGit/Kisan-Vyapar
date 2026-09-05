import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirementForm, initialFromView } from "@/components/requirements/requirement-form";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";
import { objectIdSchema } from "@/lib/validation";
import { getOwnedBuyerRequirement } from "@/features/buyer-requirements/buyer-requirement-service";

export const metadata: Metadata = {
  title: "Edit buying requirement",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function EditRequirementPage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const vendorProfileId = await getVendorProfileRecordId(user.id);
  const requirement = vendorProfileId
    ? await getOwnedBuyerRequirement(vendorProfileId, id)
    : null;
  if (!requirement) {
    notFound();
  }

  return (
    <div className="py-2 sm:py-4">
      <RequirementForm
        mode="edit"
        requirementId={requirement.id}
        initial={initialFromView(requirement)}
      />
    </div>
  );
}
