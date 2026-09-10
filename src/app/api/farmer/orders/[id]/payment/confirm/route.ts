import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { confirmFarmerPayment } from "@/features/orders/order-service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;

    const order = await confirmFarmerPayment(
      { role: "farmer", profileId: farmerProfileId, userId: user.id },
      id,
    );
    return ok(order);
  });
}
