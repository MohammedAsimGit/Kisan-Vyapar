import "server-only";
import { cache } from "react";
import { AuthenticationError } from "@/lib/errors";
import { readSessionToken } from "./cookies";
import { resolveSessionUser } from "./session-store";
import type { SessionUser } from "../types";

export const getCurrentSessionUser = cache(
  async (): Promise<SessionUser | null> => {
    const token = await readSessionToken();
    if (!token) {
      return null;
    }
    return resolveSessionUser(token);
  },
);

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentSessionUser();
  if (!user) {
    throw new AuthenticationError("Please sign in to continue.");
  }
  return user;
}
