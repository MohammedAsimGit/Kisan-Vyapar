"use client";

import { Check, ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Field, Input } from "@/components/ui";

/** Subset of the server price-guidance DTO that the workspace renders. */
export interface PriceRecommendation {
  hasSuggestion: boolean;
  suggestedPrice?: number;
  suggestedMinPrice?: number;
  suggestedMaxPrice?: number;
  suggestedRange?: { min?: number; max?: number };
  latestModalPrice?: number;
  observedRange?: { min?: number; max?: number };
  trend: "rising" | "falling" | "stable" | "insufficient_data";
  confidence: string;
  observationCount: number;
  factors: string[];
  unit: string;
  lastUpdated?: string;
}

export type PricePanelState =
  | { status: "waiting" }
  | { status: "loading" }
  | { status: "ready"; availability: string; data: PriceRecommendation }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export function unitLabel(unit: string): string {
  if (unit === "kg") return "Kg";
  if (unit === "tonne") return "Tonne";
  return "Quintal";
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(value: number): string {
  return inr.format(value);
}

export function confidenceLabel(level: string): string {
  switch (level) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    case "low":
      return "Low confidence";
    case "limited":
      return "Limited data";
    default:
      return "Insufficient data";
  }
}

export function RecommendationCard({
  state,
  cropName,
  onRetry,
  onUseSuggested,
}: {
  state: PricePanelState;
  cropName?: string;
  onRetry: () => void;
  onUseSuggested: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg">
          <Sparkles className="size-4" />
        </span>
        Recommended market price
      </h2>

      {state.status === "waiting" ? (
        <div className="mt-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Complete the crop details on the left to get a market-based price
            recommendation for {cropName ? cropName.toLowerCase() : "your crop"}.
          </p>
          <div className="mt-4 space-y-2" aria-hidden="true">
            <div className="h-3 w-2/3 rounded-full bg-muted" />
            <div className="h-3 w-1/2 rounded-full bg-muted" />
          </div>
        </div>
      ) : null}

      {state.status === "loading" ? (
        <div className="mt-4 space-y-3" role="status" aria-label="Finding the best market price">
          <p className="text-sm font-medium text-foreground">
            Finding the best market price…
          </p>
          <div className="animate-pulse space-y-2.5">
            <div className="h-9 w-48 rounded-xl bg-muted" />
            <div className="h-3 w-40 rounded-full bg-muted/70" />
            <div className="h-3 w-56 rounded-full bg-muted/70" />
          </div>
          <p className="text-xs text-muted-foreground">
            Checking current mandi prices for your area.
          </p>
        </div>
      ) : null}

      {state.status === "ready" ? (
        <ReadyRecommendation
          data={state.data}
          availability={state.availability}
          onUseSuggested={onUseSuggested}
        />
      ) : null}

      {state.status === "unavailable" ? (
        <div className="mt-4">
          <AlertCopy message={state.message} />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
            <p className="text-xs text-muted-foreground">
              You can still enter your asking price below.
            </p>
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mt-4">
          <p className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-sm leading-6 text-danger-fg">
            We couldn&apos;t get the market recommendation. You can still enter
            your asking price manually.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              Try again
            </Button>
            <p className="text-xs text-muted-foreground">
              Your crop and asking price are saved separately.
            </p>
          </div>
        </div>
      ) : null}

      {state.status === "ready" || state.status === "unavailable" ? (
        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
          This is decision support based on reported government market data — not
          a guarantee. The final asking price is yours.
        </p>
      ) : null}
    </section>
  );
}

function ReadyRecommendation({
  data,
  availability,
  onUseSuggested,
}: {
  data: PriceRecommendation;
  availability: string;
  onUseSuggested: () => void;
}) {
  if (!data.hasSuggestion || data.suggestedPrice === undefined) {
    return (
      <div className="mt-4">
        <p className="rounded-xl border border-warning-border bg-warning-bg/70 px-3.5 py-2.5 text-sm leading-6 text-warning-fg">
          Not enough recent market data to suggest a price for this crop here
          yet. You can still set your asking price below.
        </p>
        {data.observedRange?.min !== undefined &&
        data.observedRange.max !== undefined ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Observed market range: {formatInr(data.observedRange.min)} –{" "}
            {formatInr(data.observedRange.max)} per {unitLabel(data.unit)}
          </p>
        ) : null}
      </div>
    );
  }

  const suggestedRange = data.suggestedRange;
  const rangeMin = suggestedRange?.min;
  const rangeMax = suggestedRange?.max;
  const showRange = rangeMin !== undefined && rangeMax !== undefined;

  return (
    <div className="mt-4">
      <p className="text-4xl font-semibold tracking-tight text-foreground">
        {formatInr(data.suggestedPrice)}
        <span className="ml-1 text-lg font-medium text-muted-foreground">
          / {unitLabel(data.unit)}
        </span>
      </p>

      {showRange ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Market range{" "}
          <span className="font-medium text-foreground">
            {formatInr(rangeMin)} – {formatInr(rangeMax)}
          </span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{confidenceLabel(data.confidence)}</Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 rounded-full",
              availability === "fresh" ? "bg-success-fg" : "bg-warning-fg",
            )}
          />
          {availability === "fresh"
            ? "Fresh market data"
            : "Latest available market data"}
        </span>
      </div>

      {data.factors.length > 0 ? (
        <details className="group mt-4 rounded-xl border border-border bg-background/60 px-3.5 py-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
            Why this price?
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="mt-2.5 space-y-1.5 border-t border-border pt-2.5 text-sm text-muted-foreground">
            {data.factors.map((factor) => (
              <li key={factor} className="flex items-start gap-2">
                <Check className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {factor}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <Button
        type="button"
        className="mt-4 w-full"
        onClick={onUseSuggested}
      >
        <Sparkles className="size-4" />
        Use recommended price
      </Button>
    </div>
  );
}

function AlertCopy({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-warning-border bg-warning-bg/70 px-3.5 py-2.5 text-sm leading-6 text-warning-fg">
      {message}
    </p>
  );
}

export interface AskingPriceState {
  /** Raw input string from the farmer. */
  value: string;
  /** Last successfully parsed asking price on the saved listing. */
  savedPrice?: number;
}

export function AskingPriceCard({
  value,
  unit,
  suggestedRange,
  onChange,
}: {
  value: string;
  unit: string;
  suggestedRange?: { min?: number; max?: number };
  onChange: (value: string) => void;
}) {
  const parsed = Number(value);
  const hasValue = value.trim().length > 0 && Number.isFinite(parsed);
  const inRange =
    hasValue &&
    suggestedRange?.min !== undefined &&
    suggestedRange.max !== undefined &&
    parsed >= suggestedRange.min &&
    parsed <= suggestedRange.max;
  const below =
    hasValue &&
    suggestedRange?.min !== undefined &&
    parsed < suggestedRange.min;
  const above =
    hasValue &&
    suggestedRange?.max !== undefined &&
    parsed > suggestedRange.max;

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        Your asking price
      </h2>
      <Field
        htmlFor="askingPrice"
        label={`Price per ${unitLabel(unit)}`}
        className="mt-4"
      >
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground"
          >
            ₹
          </span>
          <Input
            id="askingPrice"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="e.g. 2450"
            className="h-14 pl-10 pr-16 text-2xl font-semibold"
          />
          <span
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
          >
            / {unitLabel(unit)}
          </span>
        </div>
      </Field>

      {hasValue ? (
        inRange ? (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-success-fg">
            <Check className="size-4" />
            Within the recommended market range
          </p>
        ) : below ? (
          <p className="mt-3 text-sm text-warning-fg">
            Below the market range — buyers may expect a higher asking price.
          </p>
        ) : above ? (
          <p className="mt-3 text-sm text-warning-fg">
            Above the market range — it may take longer to find a buyer at this
            price.
          </p>
        ) : null
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Optional while publishing, but buyers can see a crop without a price.
          Use the recommendation above or enter your own.
        </p>
      )}
    </section>
  );
}
