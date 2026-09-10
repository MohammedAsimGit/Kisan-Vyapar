import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { confirmVendorDelivery } from "@/features/orders/order-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const { id } = await params;

    const order = await confirmVendorDelivery(
      { role: "vendor", profileId: vendorProfileId, userId: user.id },
      id,
    );
    return ok(order);
  });
}
