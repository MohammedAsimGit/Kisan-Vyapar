import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./current-user", () => ({
  getCurrentSessionUser: vi.fn(),
  requireApiUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "./current-user";
import { requirePageRole, requirePageUser } from "./page-guards";
import type { SessionUser } from "../types";

const redirectMock = vi.mocked(redirect);
const sessionMock = vi.mocked(getCurrentSessionUser);

function farmerUser(): SessionUser {
  return {
    id: "64b000000000000000000001",
    role: "farmer",
    fullName: "Ramesh Kumar",
    phone: "9876543210",
    language: "en",
  };
}

beforeEach(() => {
  redirectMock.mockClear();
  sessionMock.mockReset();
});

describe("page guards", () => {
  it("redirects to sign in when there is no session", async () => {
    sessionMock.mockResolvedValue(null);
    await expect(requirePageUser()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
  });

  it("returns the user when signed in", async () => {
    sessionMock.mockResolvedValue(farmerUser());
    const user = await requirePageUser();
    expect(user.role).toBe("farmer");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("allows a farmer into the farmer area", async () => {
    sessionMock.mockResolvedValue(farmerUser());
    const user = await requirePageRole("farmer");
    expect(user.role).toBe("farmer");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("blocks a farmer from the vendor area and redirects to the farmer home", async () => {
    sessionMock.mockResolvedValue(farmerUser());
    await expect(requirePageRole("vendor")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/farmer");
  });

  it("blocks a farmer from the admin area", async () => {
    sessionMock.mockResolvedValue(farmerUser());
    await expect(requirePageRole("admin")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/farmer");
  });

  it("blocks an anonymous user from a protected role area", async () => {
    sessionMock.mockResolvedValue(null);
    await expect(requirePageRole("admin")).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/auth/login");
  });
});
