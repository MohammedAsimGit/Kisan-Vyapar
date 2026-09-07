import type { Metadata } from "next";
import { ProduceWorkspace } from "@/components/produce/produce-workspace";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfile } from "@/features/profiles/profile-service";

export const metadata: Metadata = {
  title: "List a crop",
};

export const dynamic = "force-dynamic";

export default async function NewProducePage() {
  const user = await requirePageUser();
  const profile = await getFarmerProfile(user.id);

  return (
    <div className="py-2 sm:py-4">
      <ProduceWorkspace
        mode="create"
        profileLocation={
          profile
            ? {
                village: profile.village,
                district: profile.district,
                state: profile.state,
                pincode: profile.pincode,
              }
            : undefined
        }
      />
    </div>
  );
}
