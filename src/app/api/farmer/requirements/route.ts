import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { parseOrThrow } from "@/lib/validation";
import {
  matchQuerySchema,
  readSearchParams,
} from "@/features/matching/query-schema";
import { getFarmerRequirementDigest } from "@/features/matching/matching-service";

export const dynamic = "force-dynamic";

/**
 * Farmer buyer-requirements digest: active requirements matched against the
 * farmer's published produce, ranked by the deterministic match score. Same
 * engine and response shape as the server-rendered page — exposed so the
 * client-side cache can reuse it across navigations.
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const query = parseOrThrow(
      matchQuerySchema,
      readSearchParams(request.nextUrl.searchParams),
    );
    const result = await getFarmerRequirementDigest(farmerProfileId, query);
    return ok(result);
  });
}