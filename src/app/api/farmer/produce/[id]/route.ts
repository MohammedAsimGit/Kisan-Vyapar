import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema, parseOrThrow } from "@/lib/validation";
import { produceListingUpdateSchema } from "@/features/produce/schemas";
import {
  deleteProduceListing,
  getFarmerProduceListing,
  updateProduceListing,
} from "@/features/produce/produce-service";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveListingId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  const result = objectIdSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError("The listing id is not valid.");
  }
  return id;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const listingId = await resolveListingId(context);
    const listing = await getFarmerProduceListing(listingId, farmerProfileId);
    if (!listing) {
      throw new NotFoundError("Listing not found.");
    }
    return ok({ listing });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const listingId = await resolveListingId(context);
    const body = await readJsonBody(request);
    const patch = parseOrThrow(produceListingUpdateSchema, body);
    const listing = await updateProduceListing(listingId, farmerProfileId, patch);
    if (!listing) {
      throw new NotFoundError("Listing not found.");
    }
    return ok({ listing });
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const listingId = await resolveListingId(context);
    await deleteProduceListing(listingId, farmerProfileId);
    return ok({ deleted: true });
  });
}
