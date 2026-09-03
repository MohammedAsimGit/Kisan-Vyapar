import { describe, expect, it } from "vitest";
import {
  toFarmerProfileView,
  toVendorProfileView,
} from "./profile-service";
import type { FarmerProfileView, VendorProfileView } from "./types";

describe("profile view mapping", () => {
  it("maps a stored farmer document into a clean view", () => {
    const view = toFarmerProfileView({
      bio: "Grows tomatoes",
      location: {
        address: {
          village: "Devanahalli",
          district: "Bengaluru Rural",
          state: "Karnataka",
          pincode: "562110",
        },
      },
    });
    expect(view).toEqual<FarmerProfileView>({
      bio: "Grows tomatoes",
      village: "Devanahalli",
      district: "Bengaluru Rural",
      state: "Karnataka",
      pincode: "562110",
    });
  });

  it("normalises empty strings to undefined in farmer views", () => {
    const view = toFarmerProfileView({
      location: { address: { district: "Mysuru", state: "Karnataka", village: "" } },
    });
    expect(view?.village).toBeUndefined();
    expect(view?.district).toBe("Mysuru");
  });

  it("returns null when no farmer document exists", () => {
    expect(toFarmerProfileView(null)).toBeNull();
  });

  it("maps a stored vendor document into a clean view", () => {
    const view = toVendorProfileView({
      businessName: "Annapurna",
      businessType: "retailer",
      location: {
        label: "Mysuru",
        address: { district: "Mysuru", state: "Karnataka", pincode: "570001" },
      },
    });
    expect(view).toEqual<VendorProfileView>({
      businessName: "Annapurna",
      businessType: "retailer",
      city: "Mysuru",
      district: "Mysuru",
      state: "Karnataka",
      pincode: "570001",
    });
  });
});
