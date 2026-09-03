import { ok, withErrorHandling } from "@/lib/api";
import { getCurrentSessionUser } from "@/features/auth/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await getCurrentSessionUser();
    return ok({ user });
  });
}
