import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { getUnreadCount } from "@/features/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    const count = await getUnreadCount(user.id);
    return ok({ count });
  });
}
