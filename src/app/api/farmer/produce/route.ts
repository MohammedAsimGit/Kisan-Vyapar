import type { NextRequest } from "next/server";
import { created, ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { parseOrThrow } from "@/lib/validation";
import { produceListingSchema } from "@/features/produce/schemas";
import {
  createProduceListing,
  getFarmerProduceListings,
} from "@/features/produce/produce-service";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const listings = await getFarmerProduceListings(farmerProfileId);
    return ok({ listings });
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const body = await readJsonBody(request);
    const input = parseOrThrow(produceListingSchema, body);
    const listing = await createProduceListing(farmerProfileId, input);
    return created({ listing });
  });
}
