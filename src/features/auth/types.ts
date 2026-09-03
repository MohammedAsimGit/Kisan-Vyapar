import { SUPPORTED_LANGUAGES } from "@/constants/languages";
import type { SupportedLanguage } from "@/constants/languages";
import type { UserRole } from "@/constants/roles";

export interface SessionUser {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email?: string;
  language: SupportedLanguage;
}

export interface RawUserLike {
  _id: unknown;
  role: UserRole;
  fullName: string;
  phone: string;
  email?: string;
  language?: SupportedLanguage;
}

export function toSessionUser(raw: RawUserLike): SessionUser {
  return {
    id: String(raw._id),
    role: raw.role,
    fullName: raw.fullName,
    phone: raw.phone,
    email: raw.email,
    language: raw.language ?? SUPPORTED_LANGUAGES.ENGLISH,
  };
}
