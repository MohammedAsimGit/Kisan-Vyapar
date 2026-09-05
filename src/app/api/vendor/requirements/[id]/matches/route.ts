import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema, parseOrThrow } from "@/lib/validation";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import {
  matchQuerySchema,
  readSearchParams,
} from "@/features/matching/query-schema";
import { getMatchesForRequirement } from "@/features/matching/matching-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The requirement id is not valid.");
    }

    const query = parseOrThrow(matchQuerySchema, readSearchParams(request.nextUrl.searchParams));
    const result = await getMatchesForRequirement(id, vendorProfileId, query);
    if (!result) {
      throw new NotFoundError("Requirement not found.");
    }
    return ok(result);
  });
}
