import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageRole } from "@/features/auth/lib/page-guards";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("admin");

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
