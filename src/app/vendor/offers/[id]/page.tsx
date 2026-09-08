"use client";

import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { NegotiationDetail } from "@/components/offers/negotiation-detail";
import { useSessionUser } from "@/lib/client/use-session-user";
import { fetchVendorOffer } from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { DYNAMIC_STALE_TIME } from "@/lib/client/query-client";
import { ScreenError, ScreenSkeleton } from "@/components/dashboard/screen-skeleton";
import { ApiRequestError } from "@/lib/client/fetch-json";

export default function VendorOfferDetailPage() {
  const params = useParams<{ id: string }>();
  const offerId = params?.id ?? "";

  const session = useSessionUser();
  const userId = session.data?.id;

  const offerQuery = useQuery({
    queryKey: kvKeys.vendor(userId ?? "").offer(offerId),
    queryFn: () => fetchVendorOffer(offerId),
    staleTime: DYNAMIC_STALE_TIME,
    enabled: Boolean(userId && offerId),
  });

  if (!userId || offerQuery.isPending) {
    return <ScreenSkeleton maxWidth="max-w-5xl" />;
  }
  if (offerQuery.isError) {
    const status = (offerQuery.error as ApiRequestError | undefined)?.status;
    if (status === 404 || status === 400) {
      notFound();
    }
    return (
      <ScreenError
        onRetry={() => void offerQuery.refetch()}
        description="We couldn't load this negotiation right now. Please try again in a moment."
      />
    );
  }

  return <NegotiationDetail offer={offerQuery.data} role="vendor" />;
}