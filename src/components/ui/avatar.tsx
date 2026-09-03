import { cn } from "@/lib/utils/cn";

const AVATAR_COLORS = [
  "bg-emerald-700",
  "bg-green-700",
  "bg-teal-700",
  "bg-lime-700",
];

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

  const colorIndex = name.length % AVATAR_COLORS.length;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
        AVATAR_COLORS[colorIndex],
        className,
      )}
    >
      {initials || "?"}
    </span>
  );
}
