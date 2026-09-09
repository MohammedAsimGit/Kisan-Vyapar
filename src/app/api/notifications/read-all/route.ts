import { ok, withErrorHandling } from "@/lib/api";
import { requireApiUser } from "@/features/auth/lib/current-user";
import { markAllAsRead } from "@/features/notifications/notification-service";

export const dynamic = "force-dynamic";

export async function PATCH(): Promise<Response> {
  return withErrorHandling(async () => {
    const user = await requireApiUser();
    await markAllAsRead(user.id);
    return ok({ success: true });
  });
}
