import { describe, expect, it } from "vitest";
import {
  getCommoditiesForCrop,
  getMappedCropIds,
  hasCropMapping,
  isKnownCrop,
} from "./crop-commodities";

describe("crop → commodity mapping", () => {
  it("maps tomato to tomato commodity names", () => {
    expect(getCommoditiesForCrop("tomato")).toContain("Tomato");
  });

  it("maps rice to paddy-related official commodities", () => {
    expect(getCommoditiesForCrop("rice")).toContain("Paddy");
  });

  it("returns an empty list for unmapped crops", () => {
    expect(getCommoditiesForCrop("unknown-crop")).toEqual([]);
    expect(hasCropMapping("unknown-crop")).toBe(false);
  });

  it("covers the known crop catalogue ids", () => {
    for (const id of getMappedCropIds()) {
      expect(isKnownCrop(id)).toBe(true);
    }
  });
});
