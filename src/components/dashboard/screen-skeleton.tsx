import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

/**
 * Lightweight placeholder shown only while a screen has NO cached data yet.
 * Once the query cache holds data, returning visits render it immediately and
 * this never appears again for that screen.
 */
export function ScreenSkeleton({
  maxWidth = "max-w-5xl",
  rows = 3,
}: {
  maxWidth?: "max-w-4xl" | "max-w-5xl";
  rows?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("mx-auto animate-pulse space-y-8", maxWidth)}
    >
      <div className="space-y-3">
        <div className="h-3.5 w-28 rounded-full bg-muted" />
        <div className="h-8 w-72 max-w-full rounded-lg bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
      </div>
      <div className="h-40 rounded-3xl bg-muted/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl bg-muted/70" />
        ))}
      </div>
    </div>
  );
}

/** Inline error state with retry — used only when there is NO cached data. */
export function ScreenError({
  title = "Couldn't load this screen",
  description = "Please check your connection and try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-6 py-12 text-center">
      <AlertTriangle className="size-8 text-warning-fg" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}