import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { parseOrThrow } from "@/lib/validation";
import { offerListQuerySchema } from "@/features/offers/schemas";
import { readSearchParams } from "@/features/matching/query-schema";
import { listVendorOffers } from "@/features/offers/offer-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const query = parseOrThrow(
      offerListQuerySchema,
      readSearchParams(request.nextUrl.searchParams),
    );
    const result = await listVendorOffers(vendorProfileId, query);
    return ok(result);
  });
}