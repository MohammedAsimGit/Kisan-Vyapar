import type { UserRole } from "@/constants/roles";
import type { SessionUser } from "@/features/auth/types";
import { roleHomePath } from "@/features/auth/paths";
import { Avatar, Badge, PageContainer } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { DashboardNav } from "./dashboard-nav";

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

        <DashboardNav role={user.role} />
      </header>

      <main className="flex-1 py-8 sm:py-10">
        <PageContainer wide>{children}</PageContainer>
      </main>
    </div>
  );
}
