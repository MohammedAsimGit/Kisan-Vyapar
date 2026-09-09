import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import {
  getLogisticsForFarmer,
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const logistics = await getLogisticsForFarmer(farmerProfileId, id);
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const body = await readJsonBody(request);
    const logistics = await updateLogistics(
      { role: "farmer", profileId: farmerProfileId },
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
    const farmerProfileId = await requireFarmerProfileId(user);
    const { id } = await params;
    const logistics = await cancelLogistics(
      { role: "farmer", profileId: farmerProfileId },
      id,
    );
    return ok(logistics);
  });
}
