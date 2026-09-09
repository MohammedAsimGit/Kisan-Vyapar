import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import {
  getOrderForFarmer,
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const order = await getOrderForFarmer(farmerProfileId, id);
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request);
    const order = await updateOrderLocation(
      { role: "farmer", profileId: farmerProfileId },
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request).catch(() => ({}));
    const order = await cancelOrder(
      { role: "farmer", profileId: farmerProfileId },
      id,
      body,
    );
    return ok(order);
  });
}
