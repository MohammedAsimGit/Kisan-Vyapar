export const SUPPORTED_LANGUAGES = {
  ENGLISH: "en",
  HINDI: "hi",
  KANNADA: "kn",
  MARATHI: "mr",
} as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const SUPPORTED_LANGUAGE_VALUES = Object.values(SUPPORTED_LANGUAGES);
