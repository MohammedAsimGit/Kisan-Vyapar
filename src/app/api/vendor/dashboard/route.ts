import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { requireVendorProfileId } from "@/features/buyer-requirements/vendor-guard";
import { listVendorRequirements } from "@/features/buyer-requirements/buyer-requirement-service";
import { countPendingOffersByRequirement } from "@/features/offers/offer-service";

export const dynamic = "force-dynamic";

/**
 * Vendor dashboard aggregate: requirements + status counts and pending
 * (unanswered) offer counts per requirement. Reuses the existing services so
 * the numbers shown are exactly the real ones the server-rendered dashboard
 * displayed — nothing invented.
 */
export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const vendorProfileId = await requireVendorProfileId(user);
    const [result, pendingCounts] = await Promise.all([
      listVendorRequirements(vendorProfileId),
      countPendingOffersByRequirement(vendorProfileId),
    ]);
    return ok({
      requirements: result.requirements,
      counts: result.counts,
      pendingCounts,
    });
  });
}