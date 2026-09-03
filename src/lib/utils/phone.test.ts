import { describe, expect, it } from "vitest";
import { phoneVariants } from "./phone";

describe("phoneVariants", () => {
  it("includes the number as typed", () => {
    expect(phoneVariants("9876500001")).toContain("9876500001");
  });

  it("matches a +91-stored number from a national-format login", () => {
    const variants = phoneVariants("9876500006");
    expect(variants).toContain("+919876500006");
    expect(variants).toContain("919876500006");
  });

  it("matches a national-stored number from a +91 login", () => {
    const variants = phoneVariants("+919876500001");
    expect(variants).toContain("9876500001");
  });

  it("matches a leading-zero-stored number from a plain login", () => {
    const variants = phoneVariants("9876500007");
    expect(variants).toContain("09876500007");
  });

  it("strips spaces and hyphens", () => {
    const variants = phoneVariants("+91 98765 00001");
    expect(variants).toContain("+919876500001");
    expect(variants).toContain("9876500001");
  });

  it("de-duplicates variants", () => {
    const variants = phoneVariants("9876500001");
    expect(new Set(variants).size).toBe(variants.length);
  });

  it("returns only the cleaned value for a non-phone input", () => {
    expect(phoneVariants("not-a-phone")).toEqual(["notaphone"]);
  });
});
