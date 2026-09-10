import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import type { OrderStatus } from "@/constants/order-statuses";
import { listVendorOrders, createOrderFromNegotiation } from "@/features/orders/order-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const params = request.nextUrl.searchParams;
    const page = parseInt(params.get("page") ?? "1", 10) || 1;
    const limit = parseInt(params.get("limit") ?? "10", 10) || 10;
    const status = params.get("status") as OrderStatus | undefined;
    const result = await listVendorOrders(vendorProfileId, { status, page, limit });
    return ok(result);
  });
}

const createOrderSchema = z.object({ offerId: z.string().min(1) });

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const body = await readJsonBody(request);
    const { offerId } = createOrderSchema.parse(body);
    const order = await createOrderFromNegotiation(
      { role: "vendor", profileId: vendorProfileId, userId: user.id },
      offerId,
    );
    return ok(order);
  });
}
