import { describe, expect, it } from "vitest";
import {
  isFarmerProfileComplete,
  isVendorProfileComplete,
  isProfileComplete,
} from "./types";

describe("profile completeness", () => {
  it("marks a farmer profile complete when district and state exist", () => {
    expect(
      isFarmerProfileComplete({ district: "Mysuru", state: "Karnataka" }),
    ).toBe(true);
  });

  it("marks a farmer profile incomplete when district or state is missing", () => {
    expect(isFarmerProfileComplete({ district: "Mysuru" })).toBe(false);
    expect(isFarmerProfileComplete(null)).toBe(false);
  });

  it("marks a vendor profile complete when business name and state exist", () => {
    expect(
      isVendorProfileComplete({ businessName: "Annapurna", state: "Karnataka" }),
    ).toBe(true);
  });

  it("marks a vendor profile incomplete without a business name", () => {
    expect(isVendorProfileComplete({ state: "Karnataka" })).toBe(false);
  });

  it("dispatches on role via isProfileComplete", () => {
    expect(
      isProfileComplete("farmer", { district: "Mysuru", state: "Karnataka" }),
    ).toBe(true);
    expect(
      isProfileComplete("vendor", { businessName: "X", state: "Karnataka" }),
    ).toBe(true);
    expect(isProfileComplete("farmer", null)).toBe(false);
  });
});
