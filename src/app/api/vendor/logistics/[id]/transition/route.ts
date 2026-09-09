import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { transitionLogisticsStatus } from "@/features/logistics/logistics-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request);
    const logistics = await transitionLogisticsStatus(
      { role: "vendor", profileId: vendorProfileId },
      id,
      body,
    );
    return ok(logistics);
  });
}
