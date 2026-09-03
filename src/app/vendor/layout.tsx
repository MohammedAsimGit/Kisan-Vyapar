import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageRole } from "@/features/auth/lib/page-guards";
import { getVendorProfile } from "@/features/profiles/profile-service";
import { isVendorProfileComplete } from "@/features/profiles/types";

export const dynamic = "force-dynamic";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("vendor");

  const profile = await getVendorProfile(user.id);
  if (!profile || !isVendorProfileComplete(profile)) {
    redirect("/onboarding");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
