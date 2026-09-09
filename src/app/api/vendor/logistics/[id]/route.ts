import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import {
  getLogisticsForVendor,
  updateLogistics,
  cancelLogistics,
} from "@/features/logistics/logistics-service";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request);
    const logistics = await updateLogistics(
      { role: "vendor", profileId: vendorProfileId },
      id,
      body,
    );
    return ok(logistics);
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;
    const logistics = await cancelLogistics(
      { role: "vendor", profileId: vendorProfileId },
      id,
    );
    return ok(logistics);
  });
}
