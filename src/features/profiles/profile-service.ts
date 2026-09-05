import "server-only";
import { connectToDatabase } from "@/lib/db";
import { FarmerProfileModel, VendorProfileModel } from "@/models";
import { USER_ROLES, type UserRole } from "@/constants/roles";
import type {
  FarmerProfileInput,
  VendorProfileInput,
} from "./schemas";
import type {
  FarmerProfileView,
  VendorProfileView,
} from "./types";

type FarmerDocShape = {
  bio?: string;
  location?: { label?: string; address?: { village?: string; district?: string; state?: string; pincode?: string } };
};

type VendorDocShape = {
  businessName?: string;
  businessType?: string;
  location?: { label?: string; address?: { district?: string; state?: string; pincode?: string } };
};

const emptyToUndefined = (value: string | undefined): string | undefined =>
  value && value.trim() !== "" ? value : undefined;

export function toFarmerProfileView(doc: FarmerDocShape | null): FarmerProfileView | null {
  if (!doc) {
    return null;
  }
  const address = doc.location?.address;
  return {
    bio: emptyToUndefined(doc.bio),
    village: emptyToUndefined(address?.village),
    district: emptyToUndefined(address?.district),
    state: emptyToUndefined(address?.state),
    pincode: emptyToUndefined(address?.pincode),
  };
}

export function toVendorProfileView(doc: VendorDocShape | null): VendorProfileView | null {
  if (!doc) {
    return null;
  }
  const address = doc.location?.address;
  return {
    businessName: emptyToUndefined(doc.businessName),
    businessType: emptyToUndefined(doc.businessType),
    city: emptyToUndefined(doc.location?.label),
    district: emptyToUndefined(address?.district),
    state: emptyToUndefined(address?.state),
    pincode: emptyToUndefined(address?.pincode),
  };
}

export async function getFarmerProfile(userId: string): Promise<FarmerProfileView | null> {
  await connectToDatabase();
  const doc = await FarmerProfileModel.findOne({ user: userId }).lean();
  return toFarmerProfileView(doc);
}

export async function saveFarmerProfile(
  userId: string,
  input: FarmerProfileInput,
): Promise<FarmerProfileView> {
  await connectToDatabase();
  await FarmerProfileModel.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        bio: input.bio ?? "",
        location: {
          address: {
            village: input.village ?? "",
            district: input.district,
            state: input.state,
            pincode: input.pincode ?? "",
          },
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();

  const updated = await getFarmerProfile(userId);
  if (!updated) {
    throw new Error("Failed to save farmer profile.");
  }
  return updated;
}

export async function getVendorProfile(userId: string): Promise<VendorProfileView | null> {
  await connectToDatabase();
  const doc = await VendorProfileModel.findOne({ user: userId }).lean();
  return toVendorProfileView(doc);
}

export async function saveVendorProfile(
  userId: string,
  input: VendorProfileInput,
): Promise<VendorProfileView> {
  await connectToDatabase();
  await VendorProfileModel.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        businessName: input.businessName,
        businessType: input.businessType,
        location: {
          label: input.city ?? "",
          address: {
            district: input.district ?? "",
            state: input.state,
            pincode: input.pincode ?? "",
          },
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  ).lean();

  const updated = await getVendorProfile(userId);
  if (!updated) {
    throw new Error("Failed to save vendor profile.");
  }
  return updated;
}

export async function getProfileForRole(
  role: UserRole,
  userId: string,
): Promise<FarmerProfileView | VendorProfileView | null> {
  if (role === USER_ROLES.FARMER) {
    return getFarmerProfile(userId);
  }
  if (role === USER_ROLES.VENDOR) {
    return getVendorProfile(userId);
  }
  return null;
}

export async function getFarmerProfileRecordId(
  userId: string,
): Promise<string | null> {
  await connectToDatabase();
  const doc = await FarmerProfileModel.findOne({ user: userId })
    .select({ _id: 1 })
    .lean();
  return doc ? String(doc._id) : null;
}

export async function getVendorProfileRecordId(
  userId: string,
): Promise<string | null> {
  await connectToDatabase();
  const doc = await VendorProfileModel.findOne({ user: userId })
    .select({ _id: 1 })
    .lean();
  return doc ? String(doc._id) : null;
}
