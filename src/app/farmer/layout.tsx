import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requirePageRole } from "@/features/auth/lib/page-guards";
import { getFarmerProfile } from "@/features/profiles/profile-service";
import { isFarmerProfileComplete } from "@/features/profiles/types";

export const dynamic = "force-dynamic";

export default async function FarmerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("farmer");

  const profile = await getFarmerProfile(user.id);
  if (!profile || !isFarmerProfileComplete(profile)) {
    redirect("/onboarding");
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
