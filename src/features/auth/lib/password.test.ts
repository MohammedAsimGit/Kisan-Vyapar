import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password so the plain value is never stored", async () => {
    const hash = await hashPassword("Farmer@123");
    expect(hash).toBeTruthy();
    expect(hash).not.toContain("Farmer@123");
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("Farmer@123");
    await expect(verifyPassword("Farmer@123", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Farmer@123");
    await expect(verifyPassword("Wrong@999", hash)).resolves.toBe(false);
  });

  it("produces different hashes for the same password (salting)", async () => {
    const first = await hashPassword("Farmer@123");
    const second = await hashPassword("Farmer@123");
    expect(first).not.toBe(second);
  });
});
