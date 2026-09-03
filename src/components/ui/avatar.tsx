import { cn } from "@/lib/utils/cn";

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-soft text-sm font-semibold text-primary-soft-fg",
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
