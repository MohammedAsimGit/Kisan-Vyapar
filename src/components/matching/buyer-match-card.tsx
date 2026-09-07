"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  IndianRupee,
  Info,
  MapPin,
  ShoppingCart,
  TriangleAlert,
  X,
} from "lucide-react";
import { linkButtonClass } from "@/components/ui/button";
import { ReasonList } from "@/components/matching/match-score";
import { cn } from "@/lib/utils/cn";
import type { MatchView, RequirementSummaryView } from "@/features/matching/views";

/**
 * Collapsed/expanded buyer-requirement match card for the farmer.
 *
 * Collapsed: buyer chip + name, needs line, match %, short verdict pills,
 * and a price/location/deadline facts row — judge a match at a glance.
 * Expanded: full reasoning, the farmer's own listing summary, readiness vs
 * required-by, and the action CTAs.
 *
 * Pure presentation. Every value comes from the existing match/requirement
 * data — nothing is recomputed, relabelled or invented here.
 */

type MatchTone = "good" | "warn" | "bad";

const CHIP_CLASSES: Record<MatchTone, string> = {
  good: "bg-success-bg text-success-fg",
  warn: "bg-warning-bg text-warning-fg",
  bad: "bg-danger-bg text-danger-fg",
};

const CHIP_TEXT: Record<MatchTone, string> = {
  good: "text-success-fg",
  warn: "text-warning-fg",
  bad: "text-danger-fg",
};

type PillIcon = "check" | "warn" | "x" | "info";
type PillTone = MatchTone | "neutral";

interface Pill {
  tone: PillTone;
  icon: PillIcon;
  label: string;
}

const PILL_CLASSES: Record<PillTone, string> = {
  good: "border-success-border bg-success-bg text-success-fg",
  warn: "border-warning-border bg-warning-bg text-warning-fg",
  bad: "border-danger-border bg-danger-bg text-danger-fg",
  neutral: "border-border bg-muted text-muted-foreground",
};

const PILL_ICONS: Record<PillIcon, typeof Check> = {
  check: Check,
  warn: TriangleAlert,
  x: X,
  info: Info,
};

function toneForScore(score: number): MatchTone {
  if (score >= 50) return "good";
  if (score === 0) return "bad";
  return "warn";
}

function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(dateOnly: string): string {
  const date = new Date(`${dateOnly}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return dateOnly;
  }
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function compactUnit(unitLabel: string, unit?: string): string {
  if (unit === "kg") return "kg";
  if (unit === "tonne") return "t";
  if (unit === "quintal") return "qtl";
  return unitLabel.toLowerCase();
}

function compactGrade(qualityLabel: string): string | undefined {
  const match = /^(A|B|C)\s*Grade$/i.exec(qualityLabel.trim());
  return match ? match[1] : undefined;
}

function shortLocation(locationText?: string): string | undefined {
  const first = locationText?.split(",")[0]?.trim();
  return first || undefined;
}

/**
 * Short verdict pills derived from the real factor scores — the same factors
 * that produced the score, presented as chips instead of sentences.
 * A crop mismatch is a hard veto, so it yields exactly one decisive pill.
 */
function buildPills(match: MatchView): Pill[] {
  const byKey = new Map(match.factors.map((factor) => [factor.key, factor]));
  const scoreOf = (key: string): number | null => byKey.get(key)?.score ?? null;
  const pills: Pill[] = [];
  const add = (pill: Pill) => pills.push(pill);

  const crop = scoreOf("crop");
  if (crop === 0) {
    return [{ tone: "bad", icon: "x", label: "Wrong crop" }];
  }
  if (crop === 100) {
    add({ tone: "good", icon: "check", label: "Crop matches" });
  }

  const quality = scoreOf("quality");
  if (quality !== null) {
    if (quality >= 75) add({ tone: "good", icon: "check", label: "Grade fits" });
    else if (quality >= 40) add({ tone: "warn", icon: "warn", label: "Lower grade" });
    else add({ tone: "bad", icon: "x", label: "Grade mismatch" });
  }

  const quantity = scoreOf("quantity");
  if (quantity !== null) {
    if (quantity >= 100) add({ tone: "good", icon: "check", label: "Qty covered" });
    else if (quantity > 0) add({ tone: "warn", icon: "warn", label: "Partial supply" });
    else add({ tone: "bad", icon: "x", label: "Qty short" });
  }

  const price = scoreOf("price");
  if (price !== null) {
    if (price >= 100) add({ tone: "good", icon: "check", label: "Price fits" });
    else if (price >= 75) add({ tone: "neutral", icon: "info", label: "Below target" });
    else add({ tone: "warn", icon: "warn", label: "Above target" });
  }

  const availability = scoreOf("availability");
  if (availability !== null) {
    if (availability >= 95) add({ tone: "good", icon: "check", label: "On time" });
    else if (availability >= 85) add({ tone: "warn", icon: "warn", label: "Tight date" });
    else if (availability > 0) add({ tone: "warn", icon: "warn", label: "Close date" });
    else add({ tone: "bad", icon: "x", label: "Too late" });
  }

  const distance = scoreOf("distance");
  if (distance !== null) {
    add(
      distance >= 75
        ? { tone: "good", icon: "check", label: "Nearby" }
        : { tone: "neutral", icon: "info", label: "Far" },
    );
  }

  return pills.slice(0, 3);
}

export interface BuyerMatchCardListing {
  id: string;
  cropName: string;
  quantity: number;
  unit: string;
  unitLabel: string;
  qualityLabel: string;
  locationText?: string;
  expectedHarvestDate?: string;
}

export interface BuyerMatchCardCta {
  href: string;
  label: string;
  variant: "primary" | "outline";
  arrow?: boolean;
}

interface BuyerMatchCardProps {
  listing: BuyerMatchCardListing;
  requirement: RequirementSummaryView;
  match: MatchView;
  /** Action buttons shown in the expanded state. Defaults to "View requirement" + "Send offer". */
  ctas?: BuyerMatchCardCta[];
}

export function BuyerMatchCard({
  listing,
  requirement,
  match,
  ctas,
}: BuyerMatchCardProps) {
  const [expanded, setExpanded] = useState(false);

  const viewHref = `/farmer/requirements/${requirement.id}`;
  const offerHref = `/farmer/offers/new?produceId=${listing.id}&requirementId=${requirement.id}`;
  const expandedCtas = ctas ?? [
    { href: viewHref, label: "View requirement", variant: "outline" as const },
    {
      href: offerHref,
      label: "Send offer",
      variant: "primary" as const,
      arrow: true,
    },
  ];

  const tone = toneForScore(match.score);
  const zeroMatch = match.score === 0;
  const pills = buildPills(match);
  const buyerName = requirement.vendor?.businessName ?? "Buyer";
  const grade = compactGrade(requirement.qualityLabel);
  const unit = compactUnit(requirement.unitLabel, requirement.unit);
  const location = shortLocation(requirement.locationText);

  return (
    <article className="rounded-xl border border-border bg-surface shadow-card">
      {/* Who wants it + how well it matches */}
      <div className="flex items-center gap-3 p-3.5 pb-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            CHIP_CLASSES[tone],
          )}
        >
          <ShoppingCart aria-hidden="true" className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {buyerName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Needs {formatQuantity(requirement.quantity)} {unit}{" "}
            {requirement.cropName}
            {grade ? ` · Grade ${grade}` : null}
          </p>
        </div>

        <p
          className={cn(
            "shrink-0 text-lg font-bold tabular-nums tracking-tight",
            CHIP_TEXT[tone],
          )}
        >
          {match.score}%
        </p>
      </div>

      {/* Short verdict pills */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pb-2.5">
        {pills.map((pill) => {
          const Icon = PILL_ICONS[pill.icon];
          return (
            <span
              key={pill.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                PILL_CLASSES[pill.tone],
              )}
            >
              <Icon aria-hidden="true" className="size-3" />
              {pill.label}
            </span>
          );
        })}
      </div>

      {/* Price / location / deadline at a glance — hidden for impossible matches */}
      {!zeroMatch ? (
        <div className="flex items-center gap-4 overflow-x-auto px-3.5 pb-3 text-xs">
          <span className="flex min-w-0 items-center gap-1.5">
            <IndianRupee
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="truncate font-medium text-foreground">
              {formatInr(requirement.targetPriceMin)}–
              {formatInr(requirement.targetPriceMax)}
            </span>
          </span>
          {location ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin
                aria-hidden="true"
                className="size-3.5 shrink-0 text-muted-foreground"
              />
              <span className="truncate font-medium text-foreground">
                {location}
              </span>
            </span>
          ) : null}
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarDays
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="truncate font-medium text-foreground">
              {formatShortDate(requirement.requiredBy)}
            </span>
          </span>
        </div>
      ) : null}

      {/* Details toggle + expanded reasoning/actions */}
      <div className="border-t border-border px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background sm:w-auto sm:justify-start sm:px-4 sm:py-1.5"
        >
          {expanded ? "Hide details" : "View details"}
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "size-4 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>

        {expanded ? (
          <div className="space-y-4 pt-3">
            <ReasonList reasons={match.reasons} />

            <div className="rounded-lg bg-muted/50 p-3 text-xs leading-5">
              <p className="font-semibold uppercase tracking-wide text-muted-foreground">
                Your listing
              </p>
              <p className="mt-1 font-medium text-foreground">
                {listing.cropName} · {formatQuantity(listing.quantity)}{" "}
                {compactUnit(listing.unitLabel, listing.unit)} ·{" "}
                {listing.qualityLabel}
                {listing.locationText ? ` · ${listing.locationText}` : ""}
              </p>
              {listing.expectedHarvestDate ? (
                <p className="mt-1.5 text-muted-foreground">
                  Ready {formatShortDate(listing.expectedHarvestDate)} · Needed
                  by {formatShortDate(requirement.requiredBy)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {expandedCtas.map((cta) => (
                <Link
                  key={`${cta.href}-${cta.label}`}
                  href={cta.href}
                  className={cn(
                    linkButtonClass(cta.variant, "md"),
                    "sm:flex-1",
                  )}
                >
                  {cta.label}
                  {cta.arrow ? <ArrowRight className="size-4" /> : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}