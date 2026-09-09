import type { NextRequest } from "next/server";
import { created, ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import type { LogisticsStatus } from "@/constants/logistics-statuses";
import {
  createLogistics,
  listVendorLogistics,
} from "@/features/logistics/logistics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const params = request.nextUrl.searchParams;
    const page = parseInt(params.get("page") ?? "1", 10) || 1;
    const limit = parseInt(params.get("limit") ?? "10", 10) || 10;
    const status = params.get("status") as LogisticsStatus | undefined;
    const result = await listVendorLogistics(vendorProfileId, { status, page, limit });
    return ok(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const body = await readJsonBody(request);
    const logistics = await createLogistics(
      { role: "vendor", profileId: vendorProfileId },
      body,
    );
    return created({ logistics });
  });
}
