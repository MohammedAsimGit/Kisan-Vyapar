import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema } from "@/lib/validation";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { acceptOffer } from "@/features/offers/offer-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The negotiation id is not valid.");
    }

    const offer = await acceptOffer(
      { role: "vendor", profileId: vendorProfileId, userId: user.id },
      id,
    );
    if (!offer) {
      throw new NotFoundError("Negotiation not found.");
    }
    return ok({ offer });
  });
}