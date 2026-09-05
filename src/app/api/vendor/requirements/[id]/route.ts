import { z } from "zod";
import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { objectIdSchema, parseOrThrow } from "@/lib/validation";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { buyerRequirementUpdateSchema } from "@/features/buyer-requirements/schemas";
import type { RequirementAction } from "@/features/buyer-requirements/buyer-requirement-service";
import {
  getOwnedBuyerRequirement,
  transitionBuyerRequirement,
  updateBuyerRequirementFields,
} from "@/features/buyer-requirements/buyer-requirement-service";

export const dynamic = "force-dynamic";

const requirementStatusTransitionSchema = z.object({
  status: z.enum(["active", "paused", "fulfilled", "cancelled"]),
});

const STATUS_TO_ACTION: Record<
  "active" | "paused" | "fulfilled" | "cancelled",
  RequirementAction
> = {
  active: "resume",
  paused: "pause",
  fulfilled: "fulfill",
  cancelled: "cancel",
};

type RouteContext = { params: Promise<{ id: string }> };

async function resolveRequirementId(context: RouteContext): Promise<string> {
  const { id } = await context.params;
  const result = objectIdSchema.safeParse(id);
  if (!result.success) {
    throw new ValidationError("The requirement id is not valid.");
  }
  return id;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const requirementId = await resolveRequirementId(context);
    const requirement = await getOwnedBuyerRequirement(vendorProfileId, requirementId);
    if (!requirement) {
      throw new NotFoundError("Requirement not found.");
    }
    return ok({ requirement });
  });
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const requirementId = await resolveRequirementId(context);
    const body = await readJsonBody(request);

    // Status transitions (pause / resume / fulfil / cancel) are controlled
    // server-side and are mutually exclusive with field edits.
    if (body !== null && typeof body === "object" && "status" in body) {
      const { status } = parseOrThrow(requirementStatusTransitionSchema, body);
      const requirement = await transitionBuyerRequirement(
        vendorProfileId,
        requirementId,
        STATUS_TO_ACTION[status],
      );
      if (!requirement) {
        throw new NotFoundError("Requirement not found.");
      }
      return ok({ requirement });
    }

    const patch = parseOrThrow(buyerRequirementUpdateSchema, body);
    const requirement = await updateBuyerRequirementFields(
      vendorProfileId,
      requirementId,
      patch,
    );
    if (!requirement) {
      throw new NotFoundError("Requirement not found.");
    }
    return ok({ requirement });
  });
}
