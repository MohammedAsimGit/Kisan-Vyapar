import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema } from "@/lib/validation";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getMarketPrices } from "@/features/market/market-service";
import { hasCropMapping } from "@/features/market/crop-commodities";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function resolveId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  if (!objectIdSchema.safeParse(id).success) {
    throw new ValidationError("The listing id is not valid.");
  }
  return id;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const listingId = await resolveId(context);

    const listing = await getFarmerProduceListing(listingId, farmerProfileId);
    if (!listing) {
      throw new NotFoundError("Listing not found.");
    }

    const result = await getMarketPrices({
      crop: listing.crop,
      state: listing.location.state,
      district: listing.location.district,
    });

    return ok({
      listing: {
        id: listing.id,
        crop: listing.crop,
        cropName: listing.cropName,
        state: listing.location.state,
        district: listing.location.district,
        mapped: hasCropMapping(listing.crop),
      },
      availability: result.availability,
      prices: result.records,
      meta: result.meta,
    });
  });
}
