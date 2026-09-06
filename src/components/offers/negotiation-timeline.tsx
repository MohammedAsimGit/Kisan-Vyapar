import { cn } from "@/lib/utils/cn";
import {
  CheckCircle2,
  Handshake,
  MessageSquareOff,
  Send,
  Undo2,
  XCircle,
} from "lucide-react";
import type { OfferHistoryAction } from "@/models/offer";
import type { OfferHistoryView } from "@/features/offers/types";

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ACTION_ICONS: Record<OfferHistoryAction, typeof Send> = {
  offer: Send,
  counter: Undo2,
  accept: CheckCircle2,
  reject: XCircle,
  withdraw: MessageSquareOff,
};

/**
 * Immutable negotiation record, rendered as a simple professional timeline —
 * not a social chat. Every proposal and every decision stays visible and
 * traceable to the final agreed terms.
 */
export function NegotiationTimeline({
  history,
}: {
  history: OfferHistoryView[];
}) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No negotiation steps yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 before:absolute before:inset-y-1 before:left-[15px] before:w-px before:bg-border sm:before:left-[19px]">
      {history.map((event, index) => {
        const Icon = ACTION_ICONS[event.action];
        const isFarmer = event.party === "farmer";
        const isLatest = index === history.length - 1;
        return (
          <li key={`${event.party}-${event.action}-${index}`} className="relative flex gap-3 sm:gap-4">
            <span
              aria-hidden="true"
              className={cn(
                "z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full border sm:size-10",
                isFarmer
                  ? "border-primary/25 bg-primary-soft text-primary-soft-fg"
                  : "border-accent/25 bg-accent-soft text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
            </span>

            <div
              className={cn(
                "min-w-0 flex-1 rounded-2xl border px-4 py-3",
                isFarmer ? "border-border bg-surface" : "border-border bg-muted/40",
                isLatest ? "shadow-card" : "",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {event.partyLabel}
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    {event.actionLabel}
                  </span>
                  {isLatest ? (
                    <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-soft-fg">
                      Latest
                    </span>
                  ) : null}
                </p>
                <time className="text-xs text-muted-foreground">
                  {formatTime(event.at)}
                </time>
              </div>

              <p className="mt-1.5 text-base font-medium tabular-nums text-foreground">
                {event.quantity} {event.unitLabel} @ {formatInr(event.pricePerUnit)} /{" "}
                {event.unitLabel}
              </p>
              <p className="text-sm text-muted-foreground">
                Total {formatInr(event.totalAmount)}
              </p>

              {event.note ? (
                <p className="mt-2 rounded-lg bg-background/70 px-3 py-2 text-sm leading-6 text-muted-foreground">
                  “{event.note}”
                </p>
              ) : null}
            </div>
          </li>
        );
      })}

      <li className="relative flex items-center gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="z-10 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground sm:size-10"
        >
          <Handshake className="size-4" />
        </span>
        <p className="text-sm text-muted-foreground">
          Negotiation started — every step above is kept permanently.
        </p>
      </li>
    </ol>
  );
}