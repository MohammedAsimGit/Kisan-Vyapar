import type { NextRequest } from "next/server";
import { created, ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { parseOrThrow } from "@/lib/validation";
import { buyerRequirementSchema } from "@/features/buyer-requirements/schemas";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import {
  createBuyerRequirement,
  listVendorRequirements,
} from "@/features/buyer-requirements/buyer-requirement-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const result = await listVendorRequirements(vendorProfileId);
    return ok(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const body = await readJsonBody(request);
    const input = parseOrThrow(buyerRequirementSchema, body);
    const requirement = await createBuyerRequirement(vendorProfileId, input);
    return created({ requirement });
  });
}
