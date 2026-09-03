const PHONE_SEPARATORS = /[\s\-().]/g;
const PHONE_SHAPE = /^\+?\d{6,15}$/;

/**
 * Returns a de-duplicated list of plausible stored formats for a phone the user
 * typed. Login matches against any of them so that `+919876543210`,
 * `919876543210`, `9876543210`, `09876543210` and space/hyphen variants all
 * resolve to the same account regardless of the format used at signup.
 */
export function phoneVariants(input: string): string[] {
  const cleaned = input.replace(PHONE_SEPARATORS, "");
  if (!PHONE_SHAPE.test(cleaned)) {
    return cleaned ? [cleaned] : [];
  }

  const candidates = new Set<string>([cleaned]);

  const digits = cleaned.replace(/\D/g, "");

  let national = digits;
  if (national.length === 12 && national.startsWith("91")) {
    national = national.slice(2);
  } else if (national.length === 11 && national.startsWith("0")) {
    national = national.slice(1);
  }

  candidates.add(digits);

  if (national.length === 10) {
    candidates.add(national);
    candidates.add(`+91${national}`);
    candidates.add(`91${national}`);
    candidates.add(`0${national}`);
  }

  return Array.from(candidates);
}
