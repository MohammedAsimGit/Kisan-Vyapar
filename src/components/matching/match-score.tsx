import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ScoreBand } from "@/features/matching/config";
import type { MatchView } from "@/features/matching/views";

const BAND_LABELS: Record<ScoreBand, string> = {
  strong: "Strong match",
  good: "Good match",
  fair: "Fair match",
  weak: "Weak match",
};

export function ScoreDisplay({
  match,
  size = "md",
  className,
}: {
  match: MatchView;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ring =
    match.score >= 75
      ? "border-success-border bg-success-bg/50 text-success-fg"
      : match.score >= 60
        ? "border-primary/30 bg-primary-soft/40 text-primary-soft-fg"
        : match.score >= 40
          ? "border-warning-border bg-warning-bg/60 text-warning-fg"
          : "border-border bg-muted/50 text-muted-foreground";

  const numberClass =
    size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3",
        ring,
        className,
      )}
    >
      <span className={cn("font-semibold tracking-tight tabular-nums", numberClass)}>
        {match.score}%
      </span>
      <span className="hidden text-sm font-medium sm:block">
        {BAND_LABELS[match.band]}
      </span>
    </div>
  );
}

const REASON_ICONS = {
  positive: CheckCircle2,
  limitation: AlertCircle,
  neutral: Info,
} as const;

const REASON_COLORS = {
  positive: "text-success-fg",
  limitation: "text-warning-fg",
  neutral: "text-muted-foreground",
} as const;

export function ReasonList({
  reasons,
  className,
}: {
  reasons: MatchView["reasons"];
  className?: string;
}) {
  if (reasons.length === 0) {
    return null;
  }
  return (
    <ul className={cn("space-y-1.5 text-sm", className)}>
      {reasons.map((reason, index) => {
        const Icon = REASON_ICONS[reason.tone];
        return (
          <li
            key={`${reason.tone}-${index}`}
            className="flex items-start gap-2 leading-6"
          >
            <Icon
              aria-hidden="true"
              className={cn("mt-1 size-3.5 shrink-0", REASON_COLORS[reason.tone])}
            />
            <span className="text-muted-foreground">{reason.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function MatchExplain({
  match,
  className,
}: {
  match: MatchView;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6", className)}>
      <ScoreDisplay match={match} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Why this matches
        </p>
        <ReasonList reasons={match.reasons} className="mt-2" />
      </div>
    </div>
  );
}
