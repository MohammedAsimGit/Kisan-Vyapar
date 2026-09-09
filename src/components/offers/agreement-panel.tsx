"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Handshake, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui";
import type { OfferView } from "@/features/offers/types";
import { useSessionUser } from "@/lib/client/use-session-user";
import { postJson } from "@/lib/client/fetch-json";
import { kvKeys } from "@/lib/client/query-keys";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Shown when a negotiation is accepted. Shows Place Order only for the
 * order initiator; shows "Waiting for..." for the other party; shows
 * View Order if an order already exists.
 */
export function AgreementPanel({
  offer,
  role,
}: {
  offer: OfferView;
  role: "farmer" | "vendor";
}) {
  const session = useSessionUser();
  const userId = session.data?.id;
  const queryClient = useQueryClient();
  const [orderCreated, setOrderCreated] = useState(false);

  const buyerName = offer.vendor.businessName ?? "The buyer";
  const farmerName = offer.farmer.farmerName ?? "The farmer";

  const isInitiator =
    Boolean(userId) &&
    Boolean(offer.orderInitiatorId) &&
    userId === offer.orderInitiatorId;
  const hasOrder = Boolean(offer.orderId) || orderCreated;

  const orderHref = role === "farmer"
    ? `/farmer/orders/${offer.orderId}`
    : `/vendor/orders/${offer.orderId}`;

  const initiatorName =
    offer.orderInitiatorRole === "farmer" ? farmerName : buyerName;

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (): Promise<{ id?: string }> => {
      const endpoint =
        role === "farmer" ? "/api/farmer/orders" : "/api/vendor/orders";
      return postJson<{ id?: string }>(endpoint, { offerId: offer.id });
    },
    onSuccess: (data) => {
      if (data?.id) {
        setOrderCreated(true);
        // Update the offer query cache so orderId is populated
        void queryClient.invalidateQueries({
          queryKey: kvKeys[role](userId ?? "").offer(offer.id),
        });
      }
    },
  });

  return (
    <div className="rounded-3xl border border-success-border bg-success-bg/50 p-6 shadow-card sm:p-8">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-success-fg">
        <Handshake className="size-4" />
        Agreement reached
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {offer.produce.cropName} · {offer.quantity} {offer.unitLabel} at{" "}
        {formatInr(offer.pricePerUnit)} / {offer.unitLabel}
      </h2>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        <Term label="Quantity" value={`${offer.quantity} ${offer.unitLabel}`} />
        <Term label="Agreed price" value={`${formatInr(offer.pricePerUnit)} / ${offer.unitLabel}`} />
        <Term label="Total amount" value={formatInr(offer.totalAmount)} />
        <Term label="Agreed on" value={formatDateOnly(offer.updatedAt)} />
      </dl>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-success-border bg-background/60 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Farmer
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{farmerName}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buyer
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{buyerName}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col items-start gap-3 border-t border-success-border pt-5">
        <p className="text-sm leading-6 text-success-fg">
          The final terms above are locked and traceable to every step of the
          negotiation.
        </p>

        {/* STATE A: Order already exists → View Order */}
        {hasOrder && offer.orderId && (
          <Link href={orderHref} className="block">
            <Button size="lg">
              <PackageCheck className="size-4" />
              View Order
            </Button>
          </Link>
        )}

        {/* STATE A: Order just created (same session) → View Order */}
        {orderCreated && !offer.orderId && (
          <Button size="lg" disabled>
            <PackageCheck className="size-4" />
            Order Created
          </Button>
        )}

        {/* STATE B: Current user is initiator → Place Order */}
        {!hasOrder && !orderCreated && isInitiator && (
          <Button
            size="lg"
            onClick={() => placeOrderMutation.mutate()}
            disabled={placeOrderMutation.isPending}
          >
            {placeOrderMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Place Order
          </Button>
        )}

        {/* Show error if place order failed */}
        {placeOrderMutation.isError && (
          <p className="text-sm text-danger">
            {(placeOrderMutation.error as Error).message || "Failed to create order."}
          </p>
        )}

        {/* STATE C: Not initiator → Waiting message */}
        {!hasOrder && !orderCreated && !isInitiator && offer.orderInitiatorRole && (
          <p className="text-sm text-muted-foreground">
            Waiting for {initiatorName} to place the order.
          </p>
        )}

        {/* STATE D: Legacy accepted without initiator info */}
        {!hasOrder && !orderCreated && !offer.orderInitiatorRole && (
          <p className="text-sm text-muted-foreground">
            Order initiation information is unavailable for this negotiation.
          </p>
        )}
      </div>
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function formatDateOnly(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
