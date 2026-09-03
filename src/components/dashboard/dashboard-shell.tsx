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
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <PageContainer className="flex items-center justify-between gap-3 py-3">
          <Brand href={home} />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={user.fullName} />
              <div className="leading-tight">
                <p className="max-w-40 truncate text-sm font-medium">{user.fullName}</p>
                <p className="text-xs capitalize text-muted-foreground">{user.role}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </PageContainer>
      </header>

      <div className="border-b border-border bg-background">
        <PageContainer>
          <nav
            aria-label="Dashboard"
            className="-mb-px flex gap-1 overflow-x-auto py-2"
          >
            {nav.map((item) =>
              item.planned ? (
                <span
                  key={item.label}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted-foreground"
                  aria-disabled="true"
                >
                  {item.label}
                  <Badge tone="outline">Soon</Badge>
                </span>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={item.active ? "page" : undefined}
                  className={cn(
                    "inline-flex shrink-0 items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </PageContainer>
      </div>

      <main className="flex-1 py-8 sm:py-10">
        <PageContainer wide>{children}</PageContainer>
      </main>
    </div>
  );
}
