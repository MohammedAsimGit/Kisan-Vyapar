"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  Package,
  Sprout,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface BottomTab {
  label: string;
  href?: string;
  icon: typeof Home;
  planned?: boolean;
}

const ROLE_TABS: Record<"farmer" | "vendor", BottomTab[]> = {
  farmer: [
    { label: "Home", href: "/farmer", icon: Home },
    { label: "My Produce", href: "/farmer/produce", icon: Sprout },
    { label: "Buyers", icon: Users, planned: true },
    { label: "Orders", icon: ClipboardList, planned: true },
  ],
  vendor: [
    { label: "Home", href: "/vendor", icon: Home },
    { label: "Requirements", icon: ClipboardList, planned: true },
    { label: "Farmers", icon: Users, planned: true },
    { label: "Orders", icon: Package, planned: true },
  ],
};

export function BottomTabNav({ role }: { role: "farmer" | "vendor" }) {
  const pathname = usePathname();
  const [toast, setToast] = useState<string | null>(null);
  const tabs = ROLE_TABS[role];

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-[0_-4px_20px_-12px_rgb(0_0_0/0.25)] backdrop-blur supports-[backdrop-filter]:bg-surface/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {toast ? (
        <p
          role="status"
          className="mx-auto mb-2 w-max max-w-[calc(100%-2rem)] rounded-full border border-border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-card"
        >
          {toast}
        </p>
      ) : null}

      <div className="mx-auto grid w-full max-w-lg grid-cols-4">
        {tabs.map((tab) => {
          const isActive = Boolean(
            tab.href &&
              (tab.href === roleHomePath(role)
                ? pathname === tab.href
                : pathname === tab.href || pathname.startsWith(`${tab.href}/`)),
          );

          const Icon = tab.icon;

          if (tab.planned || !tab.href) {
            return (
              <button
                key={tab.label}
                type="button"
                aria-disabled="true"
                onClick={() => setToast(`${tab.label} is coming in an upcoming update.`)}
                className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="relative inline-flex">
                  <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1 inline-block size-2 rounded-full bg-accent ring-2 ring-surface"
                  />
                </span>
                <span className="text-[11px] font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.label}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  isActive ? "bg-primary/10" : "",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={isActive ? 2.6 : 1.9}
                  aria-hidden="true"
                />
              </span>
              <span className={cn("text-[11px]", isActive ? "font-semibold" : "font-medium")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function roleHomePath(role: "farmer" | "vendor"): string {
  return `/${role}`;
}
