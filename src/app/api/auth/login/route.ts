import type { NextRequest } from "next/server";
import { ok, readJsonBody, withErrorHandling } from "@/lib/api";
import { authenticateUser } from "@/features/auth/auth-service";
import { createSessionForUser } from "@/features/auth/lib/session-store";
import { setSessionCookie } from "@/features/auth/lib/cookies";

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const user = await authenticateUser(body);
    const token = await createSessionForUser(user.id);

    const response = ok({ user });
    return setSessionCookie(response, token);
  });
}
