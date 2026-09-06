import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NegotiationDetail } from "@/components/offers/negotiation-detail";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";
import { getOfferForFarmer } from "@/features/offers/offer-service";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Negotiation",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function FarmerOfferDetailPage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const profileId = await getFarmerProfileRecordId(user.id);
  const offer = profileId ? await getOfferForFarmer(profileId, id) : null;
  if (!offer) {
    notFound();
  }

  return <NegotiationDetail offer={offer} role="farmer" />;
}