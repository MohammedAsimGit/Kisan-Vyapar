import Link from "next/link";
import type { UserRole } from "@/constants/roles";
import type { SessionUser } from "@/features/auth/types";
import { roleHomePath } from "@/features/auth/paths";
import { cn } from "@/lib/utils/cn";
import { Avatar, Badge, PageContainer } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
import { LogoutButton } from "@/components/auth/logout-button";

export interface DashboardNavItem {
  label: string;
  href: string;
  active: boolean;
  planned?: boolean;
}

const DASHBOARD_NAV: Record<UserRole, Omit<DashboardNavItem, "active">[]> = {
  farmer: [
    { label: "Home", href: "/farmer" },
    { label: "My Produce", href: "/farmer/produce", planned: true },
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

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  vendor: "Buyer",
  admin: "Admin",
};

export function DashboardShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const home = roleHomePath(user.role);
  const nav = DASHBOARD_NAV[user.role].map((item) => ({
    ...item,
    active: item.href === home,
  }));

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <PageContainer wide className="flex items-center justify-between gap-3 py-3">
          <Brand href={home} />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2.5 rounded-full border border-border bg-background py-1 pl-1 pr-3 sm:flex">
              <Avatar name={user.fullName} className="size-8 text-xs" />
              <div className="leading-tight">
                <p className="max-w-44 truncate text-sm font-medium text-foreground">
                  {user.fullName}
                </p>
                <Badge tone="primary" className="mt-0.5 px-1.5 py-0 text-[10px] uppercase tracking-wide">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </div>
            <LogoutButton />
          </div>
        </PageContainer>

        <PageContainer wide>
          <nav
            aria-label="Dashboard"
            className="flex items-center gap-1 overflow-x-auto py-2.5 [scrollbar-width:none]"
          >
            {nav.map((item) =>
              item.planned ? (
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
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    item.active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </PageContainer>
      </header>

      <main className="flex-1 py-8 sm:py-10">
        <PageContainer wide>{children}</PageContainer>
      </main>
    </div>
  );
}
