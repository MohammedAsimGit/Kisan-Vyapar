import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import {
  getOrderForVendor,
  updateOrderLocation,
  cancelOrder,
} from "@/features/orders/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;
    const order = await getOrderForVendor(vendorProfileId, id);
    if (!order) {
      return new Response("Order not found.", { status: 404 });
    }
    return ok(order);
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
    const order = await updateOrderLocation(
      { role: "vendor", profileId: vendorProfileId },
      id,
      body,
    );
    return ok(order);
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
    const body = await readJsonBody(request).catch(() => ({}));
    const order = await cancelOrder(
      { role: "vendor", profileId: vendorProfileId },
      id,
      body,
    );
    return ok(order);
  });
}
