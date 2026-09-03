import type { NextRequest } from "next/server";
import { created, readJsonBody, withErrorHandling } from "@/lib/api";
import { registerUser } from "@/features/auth/auth-service";
import { createSessionForUser } from "@/features/auth/lib/session-store";
import { setSessionCookie } from "@/features/auth/lib/cookies";

export async function POST(request: NextRequest): Promise<Response> {
  return withErrorHandling(async () => {
    const body = await readJsonBody(request);
    const user = await registerUser(body);
    const token = await createSessionForUser(user.id);

    const response = created({ user });
    return setSessionCookie(response, token);
  });
}
