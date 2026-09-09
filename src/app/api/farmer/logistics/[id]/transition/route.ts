import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { transitionLogisticsStatus } from "@/features/logistics/logistics-service";

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
    const logistics = await transitionLogisticsStatus(
      { role: "farmer", profileId: farmerProfileId },
      id,
      body,
    );
    return ok(logistics);
  });
}
