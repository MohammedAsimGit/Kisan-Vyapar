import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NegotiationDetail } from "@/components/offers/negotiation-detail";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";
import { getOfferForVendor } from "@/features/offers/offer-service";
import { objectIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Negotiation",
};

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export default async function VendorOfferDetailPage({ params }: RouteContext) {
  const user = await requirePageUser();
  const { id } = await params;

  if (!objectIdSchema.safeParse(id).success) {
    notFound();
  }

  const profileId = await getVendorProfileRecordId(user.id);
  const offer = profileId ? await getOfferForVendor(profileId, id) : null;
  if (!offer) {
    notFound();
  }

  return <NegotiationDetail offer={offer} role="vendor" />;
}