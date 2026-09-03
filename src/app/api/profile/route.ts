import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { AuthorizationError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import {
  farmerProfileSchema,
  vendorProfileSchema,
} from "@/features/profiles/schemas";
import {
  getProfileForRole,
  saveFarmerProfile,
  saveVendorProfile,
} from "@/features/profiles/profile-service";
import {
  isFarmerProfileComplete,
  isVendorProfileComplete,
} from "@/features/profiles/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const profile = await getProfileForRole(user.role, user.id);
    return ok({ profile });
  });
}

export async function PATCH(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const body = await readJsonBody(request);

    if (user.role === "farmer") {
      const input = parseOrThrow(farmerProfileSchema, body);
      const profile = await saveFarmerProfile(user.id, input);
      return ok({
        profile,
        complete: isFarmerProfileComplete(profile),
      });
    }

    if (user.role === "vendor") {
      const input = parseOrThrow(vendorProfileSchema, body);
      const profile = await saveVendorProfile(user.id, input);
      return ok({
        profile,
        complete: isVendorProfileComplete(profile),
      });
    }

    throw new AuthorizationError("This account type does not support profiles.");
  });
}
