import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import type { OrderStatus } from "@/constants/order-statuses";
import { listFarmerOrders, createOrderFromNegotiation } from "@/features/orders/order-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const params = request.nextUrl.searchParams;
    const page = parseInt(params.get("page") ?? "1", 10) || 1;
    const limit = parseInt(params.get("limit") ?? "10", 10) || 10;
    const status = params.get("status") as OrderStatus | undefined;
    const result = await listFarmerOrders(farmerProfileId, { status, page, limit });
    return ok(result);
  });
}

const createOrderSchema = z.object({ offerId: z.string().min(1) });

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const body = await readJsonBody(request);
    const { offerId } = createOrderSchema.parse(body);
    const order = await createOrderFromNegotiation(
      { role: "farmer", profileId: farmerProfileId },
      offerId,
    );
    return ok(order);
  });
}
