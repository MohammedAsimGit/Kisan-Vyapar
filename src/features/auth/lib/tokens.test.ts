import { describe, expect, it } from "vitest";
import {
  generateSessionToken,
  hashSessionToken,
  safeTokenEqual,
} from "./tokens";

describe("session tokens", () => {
  it("generates distinct random tokens", () => {
    const first = generateSessionToken();
    const second = generateSessionToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(32);
  });

  it("hashes tokens deterministically with sha-256", () => {
    const token = generateSessionToken();
    const first = hashSessionToken(token);
    const second = hashSessionToken(token);
    expect(first).toBe(second);
    expect(first).not.toBe(token);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("compares tokens safely", () => {
    const a = "token-a";
    expect(safeTokenEqual(a, "token-a")).toBe(true);
    expect(safeTokenEqual(a, "token-b")).toBe(false);
    expect(safeTokenEqual(a, "different-length")).toBe(false);
  });
});
