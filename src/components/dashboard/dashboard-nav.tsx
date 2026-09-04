"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/constants/roles";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui";

interface NavItem {
  label: string;
  href: string;
  planned?: boolean;
}

const DASHBOARD_NAV: Record<UserRole, NavItem[]> = {
  farmer: [
    { label: "Home", href: "/farmer" },
    { label: "My Produce", href: "/farmer/produce" },
    { label: "Buyers", href: "/farmer/buyers", planned: true },
    { label: "Orders", href: "/farmer/orders", planned: true },
    { label: "Profile", href: "/farmer/profile", planned: true },
  ],
  vendor: [
    { label: "Home", href: "/vendor" },
    { label: "Requirements", href: "/vendor/requirements", planned: true },
    { label: "Farmers", href: "/vendor/farmers", planned: true },
    { label: "Orders", href: "/vendor/orders", planned: true },
    { label: "Profile", href: "/vendor/profile", planned: true },
  ],
  admin: [
    { label: "Home", href: "/admin" },
    { label: "Farmers", href: "/admin/farmers", planned: true },
    { label: "Vendors", href: "/admin/vendors", planned: true },
    { label: "Reports", href: "/admin/reports", planned: true },
  ],
};

export function DashboardNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = DASHBOARD_NAV[role];

  return (
    <nav
      aria-label="Dashboard"
      className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [scrollbar-width:none]"
    >
      {items.map((item) => {
        if (item.planned) {
          return (
            <span
              key={item.label}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm text-muted-foreground"
              aria-disabled="true"
            >
              {item.label}
              <Badge tone="outline" className="px-1.5 py-0.5 text-[10px]">
                Soon
              </Badge>
            </span>
          );
        }

        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
