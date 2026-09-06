import { Handshake } from "lucide-react";
import { Button } from "@/components/ui";
import type { OfferView } from "@/features/offers/types";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Shown when a negotiation is accepted. The agreed terms are final and
 * immutable; an order is deliberately NOT created here — Sprint 7 builds on
 * this boundary.
 */
export function AgreementPanel({ offer }: { offer: OfferView }) {
  const buyerName = offer.vendor.businessName ?? "The buyer";
  const farmerName = offer.farmer.farmerName ?? "The farmer";

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
        <Button
          size="lg"
          disabled
          title="Order creation arrives in the next update"
        >
          Continue to Order · Next update
        </Button>
        <p className="text-xs text-muted-foreground">
          No order is created yet — order creation is the next update and will
          build directly on this agreement.
        </p>
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