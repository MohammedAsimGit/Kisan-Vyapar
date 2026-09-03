import type { UserRole } from "@/constants/roles";

export interface FarmerProfileView {
  bio?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export interface VendorProfileView {
  businessName?: string;
  businessType?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}

export function isFarmerProfileComplete(profile: FarmerProfileView | null): boolean {
  return Boolean(profile?.district && profile.state);
}

export function isVendorProfileComplete(profile: VendorProfileView | null): boolean {
  return Boolean(profile?.businessName && profile.state);
}

export function isProfileComplete(role: UserRole, profile: unknown): boolean {
  if (role === "farmer") {
    return isFarmerProfileComplete(profile as FarmerProfileView | null);
  }
  return isVendorProfileComplete(profile as VendorProfileView | null);
}
