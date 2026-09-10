import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { reportDeliveryIssue } from "@/features/orders/order-service";
import { z } from "zod";

const reportIssueSchema = z.object({
  reason: z.string().min(10).max(400),
});

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request);
    const { reason } = reportIssueSchema.parse(body);

    const order = await reportDeliveryIssue(
      { role: "farmer", profileId: farmerProfileId, userId: user.id },
      id,
      reason,
    );
    return ok(order);
  });
}
