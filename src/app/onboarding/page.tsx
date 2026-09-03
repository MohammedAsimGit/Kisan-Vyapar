import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FarmerProfileForm } from "@/components/profiles/farmer-profile-form";
import { VendorProfileForm } from "@/components/profiles/vendor-profile-form";
import { requirePageUser } from "@/features/auth/lib/page-guards";
import { roleHomePath } from "@/features/auth/paths";
import {
  getFarmerProfile,
  getVendorProfile,
} from "@/features/profiles/profile-service";
import { isFarmerProfileComplete, isVendorProfileComplete } from "@/features/profiles/types";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requirePageUser();

  if (user.role === "farmer") {
    const profile = await getFarmerProfile(user.id);
    if (profile && isFarmerProfileComplete(profile)) {
      redirect(roleHomePath(user.role));
    }
    return (
      <OnboardingShell
        title="A little about your farm"
        subtitle="This helps buyers trust who they are buying from. You can change it later."
      >
        <FarmerProfileForm initial={profile} />
      </OnboardingShell>
    );
  }

  if (user.role === "vendor") {
    const profile = await getVendorProfile(user.id);
    if (profile && isVendorProfileComplete(profile)) {
      redirect(roleHomePath(user.role));
    }
    return (
      <OnboardingShell
        title="A little about your business"
        subtitle="This tells farmers who they are selling to. You can change it later."
      >
        <VendorProfileForm initial={profile} />
      </OnboardingShell>
    );
  }

  redirect(roleHomePath(user.role));
}

function OnboardingShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <AuthLayout>
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-raised sm:p-8">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Check className="size-3.5" />
            Last step to your dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </AuthLayout>
  );
}
