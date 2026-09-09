import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Sprout } from "lucide-react";
import { Badge } from "@/components/ui";
import { OfferStatusBadge } from "./offer-status-badge";
import { NegotiationActions } from "./negotiation-actions";
import { NegotiationTimeline } from "./negotiation-timeline";
import { AgreementPanel } from "./agreement-panel";
import { MatchExplain } from "@/components/matching/match-score";
import { matchViewForOffer } from "@/features/offers/match";
import type { OfferView } from "@/features/offers/types";

type OfferParty = "farmer" | "vendor";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Negotiation detail shared by both sides. The timeline is the immutable
 * record; the current terms mirror the latest proposal; the Sprint 5 match
 * score is shown for context only (same engine, same inputs, never
 * recalculated differently).
 */
export function NegotiationDetail({
  offer,
  role,
}: {
  offer: OfferView;
  role: OfferParty;
}) {
  const backHref = role === "farmer" ? "/farmer/offers" : "/vendor/offers";
  const counterparty =
    role === "farmer"
      ? offer.vendor.businessName ?? "A buyer"
      : offer.farmer.farmerName ?? "A farmer";

  const match = matchViewForOffer(offer);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" />
        Back to {role === "farmer" ? "My Negotiations" : "Offers"}
      </Link>

      {/* Header */}
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-3xl">
              <span aria-hidden="true">{offer.produce.cropEmoji ?? "🌱"}</span>
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {offer.produce.cropName} negotiation
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-muted-foreground">
                <span className="font-medium text-foreground">{counterparty}</span>
                <span>
                  {offer.quantity} {offer.unitLabel} @ {formatInr(offer.pricePerUnit)} /{" "}
                  {offer.unitLabel}
                </span>
              </p>
            </div>
          </div>
          <OfferStatusBadge status={offer.status} className="self-start px-3 py-1.5" />
        </div>

        {/* Current terms */}
        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-4">
          <Term label="Quantity" value={`${offer.quantity} ${offer.unitLabel}`} />
          <Term
            label="Price per unit"
            value={`${formatInr(offer.pricePerUnit)} / ${offer.unitLabel}`}
          />
          <Term label="Total amount" value={formatInr(offer.totalAmount)} />
          <Term
            label="Buyer still needs"
            value={`${offer.requirement.remainingQuantity} ${offer.requirement.unitLabel}`}
          />
        </dl>
      </div>

      {/* Produce + requirement context */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Sprout className="size-3.5 text-primary" />
            {role === "farmer" ? "Your produce listing" : "Farmer's produce listing"}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <Term label="Crop" value={offer.produce.cropName} />
            <Term label="Grade" value={offer.produce.qualityLabel} />
            <Term label="Listed quantity" value={`${offer.produce.quantity} ${offer.produce.unitLabel}`} />
            <Term
              label="Asking price"
              value={
                offer.produce.askingPricePerUnit !== undefined
                  ? `${formatInr(offer.produce.askingPricePerUnit)} / ${offer.produce.unitLabel}`
                  : "Not set"
              }
            />
          </dl>
          <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {offer.produce.locationText ? (
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {offer.produce.locationText}
              </p>
            ) : null}
            {offer.produce.expectedHarvestDate ? (
              <p className="flex items-start gap-1.5">
                <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Ready: {formatDate(offer.produce.expectedHarvestDate)}
              </p>
            ) : null}
          </div>
          <Link
            href={
              role === "farmer"
                ? `/farmer/produce/${offer.produce.id}`
                : `/vendor/produce/${offer.produce.id}`
            }
            className="mt-4 inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View listing
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Badge tone="primary" className="px-1.5 py-0.5 text-[10px]">
              Buyer
            </Badge>
            {role === "farmer" ? "This buyer requirement" : "Your requirement"}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <Term label="Needed" value={`${offer.requirement.quantity} ${offer.requirement.unitLabel}`} />
            <Term label="Grade" value={offer.requirement.qualityLabel} />
            <Term
              label="Target price"
              value={`${formatInr(offer.requirement.targetPriceMin)} – ${formatInr(offer.requirement.targetPriceMax)} / ${offer.requirement.unitLabel}`}
            />
            <Term
              label="Required by"
              value={formatDate(offer.requirement.requiredBy)}
            />
          </dl>
          {offer.requirement.locationText ? (
            <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {offer.requirement.locationText}
            </p>
          ) : null}
          <Link
            href={`/vendor/requirements/${offer.requirement.id}`}
            className="mt-4 inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View requirement
          </Link>
        </div>
      </div>

      {/* Informational Sprint 5 match score */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Match context
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          The Sprint 5 match score for this produce and requirement — shown for
          context only; it does not change during negotiation.
        </p>
        <MatchExplain match={match} className="mt-4" />
      </div>

      {/* Outcome + actions */}
      {offer.status === "accepted" ? (
        <AgreementPanel offer={offer} role={role} />
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">Your move</h2>
          <div className="mt-3">
            <NegotiationActions offer={offer} role={role} />
          </div>
        </div>
      )}

      {/* Immutable history */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Negotiation history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every offer and counter is kept permanently — nothing is ever
            overwritten.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
          <NegotiationTimeline history={offer.history} />
        </div>
      </section>

      {offer.status === "accepted" && offer.orderId && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge tone="outline" className="px-1.5 py-0.5 text-[10px]">
            Order
          </Badge>
          An order has been created from this agreement.
        </p>
      )}
    </div>
  );
}

function Term({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  );
}