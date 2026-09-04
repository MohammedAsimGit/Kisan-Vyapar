import "server-only";
import { USER_ROLES } from "@/constants/roles";
import { AuthorizationError } from "@/lib/errors";
import type { SessionUser } from "@/features/auth/types";
import { getFarmerProfileRecordId } from "@/features/profiles/profile-service";

export async function requireFarmerProfileId(
  user: SessionUser,
): Promise<string> {
  if (user.role !== USER_ROLES.FARMER) {
    throw new AuthorizationError("Only farmers can manage produce.");
  }
  const profileId = await getFarmerProfileRecordId(user.id);
  if (!profileId) {
    throw new AuthorizationError(
      "Please complete your farmer profile before adding produce.",
    );
  }
  return profileId;
}
