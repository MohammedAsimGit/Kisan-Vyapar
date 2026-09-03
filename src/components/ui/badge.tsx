import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "outline"
  | "primary";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-bg text-success-fg border border-success-border",
  warning: "bg-warning-bg text-warning-fg border border-warning-border",
  info: "bg-info-bg text-info-fg border border-info-border",
  outline: "border border-border text-muted-foreground",
  primary: "bg-primary-soft text-primary-soft-fg border border-primary/25",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
