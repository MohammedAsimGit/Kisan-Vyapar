import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema } from "@/lib/validation";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { getFarmerProduceListing } from "@/features/produce/produce-service";
import { getMarketPrices } from "@/features/market/market-service";
import { buildPriceGuidanceDto } from "@/features/pricing/pricing-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The listing id is not valid.");
    }

    const listing = await getFarmerProduceListing(id, farmerProfileId);
    if (!listing) {
      throw new NotFoundError("Listing not found.");
    }

    const market = await getMarketPrices({
      crop: listing.crop,
      state: listing.location.state,
      district: listing.location.district,
    });

    const guidance = buildPriceGuidanceDto(market.records);

    return ok({
      listing: {
        id: listing.id,
        crop: listing.crop,
        cropName: listing.cropName,
        quantity: listing.quantity,
        unit: listing.unit,
        quality: listing.qualityLabel,
      },
      availability: market.availability,
      guidance,
    });
  });
}
