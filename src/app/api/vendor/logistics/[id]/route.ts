import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { getLogisticsForVendor } from "@/features/logistics/logistics-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;
    const logistics = await getLogisticsForVendor(vendorProfileId, id);
    if (!logistics) {
      return new Response("Logistics record not found.", { status: 404 });
    }
    return ok(logistics);
  });
}
