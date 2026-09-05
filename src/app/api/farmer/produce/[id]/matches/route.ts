import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema, parseOrThrow } from "@/lib/validation";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import {
  matchQuerySchema,
  readSearchParams,
} from "@/features/matching/query-schema";
import { getMatchesForProduceListing } from "@/features/matching/matching-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The listing id is not valid.");
    }

    // Ownership check doubles as the "listing exists" check and keeps a farmer
    // from matching someone else's produce.
    const owned = await getFarmerProduceListing(id, farmerProfileId);
    if (!owned) {
      throw new NotFoundError("Listing not found.");
    }

    const query = parseOrThrow(matchQuerySchema, readSearchParams(request.nextUrl.searchParams));
    const result = await getMatchesForProduceListing(id, farmerProfileId, query);
    if (!result) {
      throw new NotFoundError("Listing not found.");
    }
    return ok(result);
  });
}
