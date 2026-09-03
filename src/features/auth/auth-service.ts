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
import { phoneVariants } from "@/lib/utils/phone";

const DEBUG_AUTH = process.env.NODE_ENV !== "production";

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

  let filter: { phone: { $in: string[] } } | { email: string };
  if (looksLikeEmail) {
    filter = { email: identifier.toLowerCase() };
  } else {
    const candidates = phoneVariants(identifier);
    filter = { phone: { $in: candidates } };
    if (DEBUG_AUTH) {
      console.info("[auth] login", {
        type: "phone",
        candidateCount: candidates.length,
        candidates,
      });
    }
  }

  const user = await UserModel.findOne(filter).select("+passwordHash");

  if (DEBUG_AUTH) {
    console.info("[auth] login", {
      type: looksLikeEmail ? "email" : "phone",
      userFound: Boolean(user),
    });
  }

  if (!user) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  const passwordMatches =
    user.passwordHash !== undefined &&
    (await verifyPassword(data.password, user.passwordHash));

  if (DEBUG_AUTH) {
    console.info("[auth] login", { passwordMatches });
  }

  if (!passwordMatches) {
    throw new AuthenticationError("Incorrect phone/email or password.");
  }

  return toSessionUser(user);
}
