import { cn } from "@/lib/utils/cn";

export type AlertTone = "info" | "success" | "error" | "warning";

const toneClasses: Record<AlertTone, string> = {
  info: "border-info-border bg-info-bg text-info-fg",
  success: "border-success-border bg-success-bg text-success-fg",
  warning: "border-warning-border bg-warning-bg text-warning-fg",
  error: "border-danger-border bg-danger-bg text-danger-fg",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-6 shadow-inset",
        toneClasses[tone],
        className,
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
