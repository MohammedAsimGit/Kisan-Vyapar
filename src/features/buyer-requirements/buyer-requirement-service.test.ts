import { describe, expect, it } from "vitest";
import {
  canEditRequirement,
  nextStatusForAction,
} from "./buyer-requirement-service";

describe("nextStatusForAction", () => {
  it("only lets an active requirement be paused", () => {
    expect(nextStatusForAction("pause", "active")).toEqual({ ok: true, status: "paused" });
    expect(nextStatusForAction("pause", "paused").ok).toBe(false);
    expect(nextStatusForAction("pause", "fulfilled").ok).toBe(false);
    expect(nextStatusForAction("pause", "cancelled").ok).toBe(false);
    expect(nextStatusForAction("pause", "expired").ok).toBe(false);
  });

  it("only lets a paused requirement be resumed", () => {
    expect(nextStatusForAction("resume", "paused")).toEqual({ ok: true, status: "active" });
    expect(nextStatusForAction("resume", "active").ok).toBe(false);
    expect(nextStatusForAction("resume", "fulfilled").ok).toBe(false);
  });

  it("only lets an active requirement be marked fulfilled", () => {
    expect(nextStatusForAction("fulfill", "active")).toEqual({ ok: true, status: "fulfilled" });
    expect(nextStatusForAction("fulfill", "paused").ok).toBe(false);
    expect(nextStatusForAction("fulfill", "fulfilled").ok).toBe(false);
  });

  it("lets active or paused requirements be cancelled, but not terminal ones", () => {
    expect(nextStatusForAction("cancel", "active")).toEqual({ ok: true, status: "cancelled" });
    expect(nextStatusForAction("cancel", "paused")).toEqual({ ok: true, status: "cancelled" });
    expect(nextStatusForAction("cancel", "fulfilled").ok).toBe(false);
    expect(nextStatusForAction("cancel", "cancelled").ok).toBe(false);
    expect(nextStatusForAction("cancel", "expired").ok).toBe(false);
  });

  it("explains why a transition is not allowed", () => {
    const result = nextStatusForAction("fulfill", "expired");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("expired");
    }
  });
});

describe("canEditRequirement", () => {
  it("allows editing active or paused requirements", () => {
    expect(canEditRequirement("active").ok).toBe(true);
    expect(canEditRequirement("paused").ok).toBe(true);
  });

  it("blocks edits to terminal states", () => {
    expect(canEditRequirement("fulfilled").ok).toBe(false);
    expect(canEditRequirement("expired").ok).toBe(false);
    expect(canEditRequirement("cancelled").ok).toBe(false);
  });
});
