import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProduceForm } from "@/components/produce/produce-form";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Edit crop",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function EditProducePage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const profileId = await getFarmerProfileRecordId(user.id);
  const listing = profileId ? await getFarmerProduceListing(id, profileId) : null;

  if (!listing) {
    notFound();
  }

  return (
    <div className="py-2 sm:py-4">
      <ProduceForm
        mode="edit"
        listingId={listing.id}
        initial={{
          crop: listing.crop,
          variety: listing.variety,
          quantity: listing.quantity,
          unit: listing.unit,
          quality: listing.quality,
          location: {
            village: listing.location.village,
            district: listing.location.district,
            state: listing.location.state,
            pincode: listing.location.pincode,
          },
          expectedHarvestDate: listing.expectedHarvestDate,
        }}
      />
    </div>
  );
}
