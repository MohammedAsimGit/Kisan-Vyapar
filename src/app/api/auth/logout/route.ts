import { ok, withErrorHandling } from "@/lib/api";
import { clearSessionCookie, readSessionToken } from "@/features/auth/lib/cookies";
import { deleteSessionForToken } from "@/features/auth/lib/session-store";

export async function POST(): Promise<Response> {
  return withErrorHandling(async () => {
    const token = await readSessionToken();
    if (token) {
      try {
        await deleteSessionForToken(token);
      } catch (error) {
        // Server-side revocation failed; still clear the local cookie so the
        // user is signed out on this device. Details stay in server logs.
        console.error("[auth] failed to delete session:", error);
      }
    }
    return clearSessionCookie(ok({ signedOut: true }));
  });
}
