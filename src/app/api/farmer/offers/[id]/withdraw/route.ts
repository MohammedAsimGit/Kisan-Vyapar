import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema } from "@/lib/validation";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { withdrawOffer } from "@/features/offers/offer-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The negotiation id is not valid.");
    }

    const offer = await withdrawOffer(
      { role: "farmer", profileId: farmerProfileId },
      id,
    );
    if (!offer) {
      throw new NotFoundError("Negotiation not found.");
    }
    return ok({ offer });
  });
}