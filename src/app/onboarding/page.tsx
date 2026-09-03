import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCardContainer, Card } from "@/components/ui";
import { Brand } from "@/components/shared/brand";
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
      <OnboardingShell heading="Tell us about your farm" subheading="One short step before your farmer dashboard.">
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
      <OnboardingShell heading="Tell us about your business" subheading="One short step before your vendor dashboard.">
        <VendorProfileForm initial={profile} />
      </OnboardingShell>
    );
  }

  redirect(roleHomePath(user.role));
}

function OnboardingShell({
  heading,
  subheading,
  children,
}: {
  heading: string;
  subheading: string;
  children: React.ReactNode;
}) {
  return (
    <AuthCardContainer>
      <div className="mb-6 flex justify-center">
        <Brand />
      </div>
      <div className="space-y-2 pb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
        <p className="text-muted-foreground">{subheading}</p>
      </div>
      <Card>{children}</Card>
    </AuthCardContainer>
  );
}
