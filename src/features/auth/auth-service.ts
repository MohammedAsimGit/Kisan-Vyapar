import "server-only";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models";
import { SUPPORTED_LANGUAGES } from "@/constants/languages";
import { USER_STATUSES } from "@/constants/user-statuses";
import { AuthenticationError, ConflictError } from "@/lib/errors";
import { parseOrThrow } from "@/lib/validation";
import { loginSchema, registerSchema } from "./schemas";
import { hashPassword, verifyPassword } from "./lib/password";
import { toSessionUser, type SessionUser } from "./types";

export async function registerUser(input: unknown): Promise<SessionUser> {
  const data = parseOrThrow(registerSchema, input);

  const phone = data.phone;
  const email = data.email;

  await connectToDatabase();

  const existing = await UserModel.exists({
    $or: [{ phone }, ...(email ? [{ email }] : [])],
  });

  if (existing) {
    throw new ConflictError(
      "An account with this phone number or email already exists. Please sign in.",
    );
  }

  const passwordHash = await hashPassword(data.password);

  const user = await UserModel.create({
    role: data.role,
    fullName: data.fullName,
    phone,
    email,
    passwordHash,
    language: SUPPORTED_LANGUAGES.ENGLISH,
  });

  return toSessionUser(user);
}

export async function authenticateUser(input: unknown): Promise<SessionUser> {
  const data = parseOrThrow(loginSchema, input);

  const identifier = data.identifier;
  const looksLikeEmail = identifier.includes("@");

  await connectToDatabase();

  const user = await UserModel.findOne({
    $or: [
      { phone: identifier },
      ...(looksLikeEmail ? [{ email: identifier.toLowerCase() }] : []),
    ],
  }).select("+passwordHash");

  if (!user) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  const passwordMatches =
    user.passwordHash !== undefined &&
    (await verifyPassword(data.password, user.passwordHash));

  if (!passwordMatches) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  return toSessionUser(user);
}
