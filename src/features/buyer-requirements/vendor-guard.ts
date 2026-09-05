import "server-only";
import { USER_ROLES } from "@/constants/roles";
import { AuthorizationError } from "@/lib/errors";
import type { SessionUser } from "@/features/auth/types";
import { getVendorProfileRecordId } from "@/features/profiles/profile-service";

export async function requireVendorProfileId(
  user: SessionUser,
): Promise<string> {
  if (user.role !== USER_ROLES.VENDOR) {
    throw new AuthorizationError("Only vendors can manage buying requirements.");
  }
  const profileId = await getVendorProfileRecordId(user.id);
  if (!profileId) {
    throw new AuthorizationError(
      "Please complete your vendor profile before posting a requirement.",
    );
  }
  return profileId;
}
