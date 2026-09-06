import type { NextRequest } from "next/server";
import { created, ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { parseOrThrow } from "@/lib/validation";
import {
  offerListQuerySchema,
} from "@/features/offers/schemas";
import { readSearchParams } from "@/features/matching/query-schema";
import {
  createOffer,
  listFarmerOffers,
} from "@/features/offers/offer-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const query = parseOrThrow(
      offerListQuerySchema,
      readSearchParams(request.nextUrl.searchParams),
    );
    const result = await listFarmerOffers(farmerProfileId, query);
    return ok(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const body = await readJsonBody(request);
    const offer = await createOffer(farmerProfileId, body);
    return created({ offer });
  });
}