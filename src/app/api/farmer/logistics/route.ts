import type { NextRequest } from "next/server";
import { created, ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import type { LogisticsStatus } from "@/constants/logistics-statuses";
import {
  createLogistics,
  listFarmerLogistics,
} from "@/features/logistics/logistics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const params = request.nextUrl.searchParams;
    const page = parseInt(params.get("page") ?? "1", 10) || 1;
    const limit = parseInt(params.get("limit") ?? "10", 10) || 10;
    const status = params.get("status") as LogisticsStatus | undefined;
    const result = await listFarmerLogistics(farmerProfileId, { status, page, limit });
    return ok(result);
  });
}

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);
    const body = await readJsonBody(request);
    const logistics = await createLogistics(
      { role: "farmer", profileId: farmerProfileId },
      body,
    );
    return created({ logistics });
  });
}
