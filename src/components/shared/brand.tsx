import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Sprout } from "lucide-react";

export function Brand({
  className,
  href = "/",
  tone = "default",
  markClassName,
}: {
  className?: string;
  href?: string;
  tone?: "default" | "light";
  markClassName?: string;
}) {
  const markTone =
    tone === "light" ? "bg-white/15 text-white" : "bg-primary text-primary-foreground";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none",
        tone === "light"
          ? "text-white focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          : "text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-xl shadow-sm transition-transform duration-200 group-hover:-rotate-6",
          markTone,
          markClassName,
        )}
      >
        <Sprout className="size-5" strokeWidth={2.1} />
      </span>
      <span className="text-lg font-semibold tracking-tight">Kisan Vyapar</span>
    </Link>
  );
}
