import "server-only";
import { connectToDatabase } from "@/lib/db";
import { SessionModel, UserModel } from "@/models";
import { USER_STATUSES } from "@/constants/user-statuses";
import { SESSION_DURATION_MS } from "@/constants/auth";
import {
  generateSessionToken,
  hashSessionToken,
} from "./tokens";
import { toSessionUser, type SessionUser } from "../types";

export async function createSessionForUser(userId: string): Promise<string> {
  const token = generateSessionToken();

  await connectToDatabase();
  await SessionModel.create({
    user: userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
  });

  return token;
}

export async function resolveSessionUser(rawToken: string): Promise<SessionUser | null> {
  const tokenHash = hashSessionToken(rawToken);

  await connectToDatabase();

  const session = await SessionModel.findOne({ tokenHash });
  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await SessionModel.deleteOne({ _id: session._id });
    return null;
  }

  const user = await UserModel.findById(session.user);
  if (!user || user.status !== USER_STATUSES.ACTIVE) {
    await SessionModel.deleteOne({ _id: session._id });
    return null;
  }

  return toSessionUser(user);
}

export async function deleteSessionForToken(rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  await connectToDatabase();
  await SessionModel.deleteOne({ tokenHash });
}
