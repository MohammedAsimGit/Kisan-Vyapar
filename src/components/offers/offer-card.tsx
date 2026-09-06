import Link from "next/link";
import { ArrowRight, Clock, Store, UserRound } from "lucide-react";
import type { OfferView } from "@/features/offers/types";
import { OfferStatusBadge } from "./offer-status-badge";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Compact, role-aware negotiation row. Shows the counterparty, the latest
 * proposed terms and the offer state — never anything fabricated.
 */
export function OfferCard({
  offer,
  role,
  href,
}: {
  offer: OfferView;
  role: "farmer" | "vendor";
  href: string;
}) {
  const counterparty =
    role === "farmer"
      ? offer.vendor.businessName
      : offer.farmer.farmerName;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-row sm:items-center"
    >
      <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl">
        <span aria-hidden="true">{offer.produce.cropEmoji ?? "🌱"}</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-base font-semibold tracking-tight text-foreground">
            {offer.produce.cropName}
          </h3>
          {counterparty ? (
            <span className="inline-flex items-center gap-1 truncate text-sm text-muted-foreground">
              {role === "farmer" ? (
                <Store className="size-3.5 shrink-0 text-primary" />
              ) : (
                <UserRound className="size-3.5 shrink-0 text-primary" />
              )}
              {counterparty}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              {role === "farmer" ? "A buyer" : "A farmer"}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {offer.quantity} {offer.unitLabel} @ {formatInr(offer.pricePerUnit)} /{" "}
          {offer.unitLabel} · {formatInr(offer.totalAmount)} total
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
        <OfferStatusBadge status={offer.status} />
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {formatUpdated(offer.updatedAt)}
        </p>
      </div>

      <span className="sr-only">Open negotiation</span>
      <ArrowRight
        aria-hidden="true"
        className="hidden size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 sm:block"
      />
    </Link>
  );
}