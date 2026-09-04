import { z } from "zod";
import type { NextRequest } from "next/server";
import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema, parseOrThrow } from "@/lib/validation";
import { requireFarmerProfileId } from "@/features/produce/farmer-guard";
import { setProduceAskingPrice } from "@/features/produce/produce-service";

export const dynamic = "force-dynamic";

const askingPriceSchema = z.object({
  pricePerUnit: z
    .number({ error: "Please enter a price." })
    .min(0, "Price cannot be negative.")
    .max(10_000_000, "Price is too large."),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const farmerProfileId = await requireFarmerProfileId(user);

    const { id } = await context.params;
    if (!objectIdSchema.safeParse(id).success) {
      throw new ValidationError("The listing id is not valid.");
    }

    const body = await readBody(request);
    const { pricePerUnit } = parseOrThrow(askingPriceSchema, body);

    const askingPrice = await setProduceAskingPrice(id, farmerProfileId, pricePerUnit);
    if (askingPrice === null) {
      throw new NotFoundError("Listing not found.");
    }

    return ok({ askingPrice });
  });
}

async function readBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
