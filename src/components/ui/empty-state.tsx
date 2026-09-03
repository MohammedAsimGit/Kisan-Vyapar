import { cn } from "@/lib/utils/cn";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg shadow-inset">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
