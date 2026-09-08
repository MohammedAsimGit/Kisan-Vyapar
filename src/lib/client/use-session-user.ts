"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSessionUser } from "./api-queries";
import { SESSION_STALE_TIME } from "./query-client";
import { kvKeys } from "./query-keys";

/**
 * The authenticated session, fetched once and cached for the session window.
 * Query keys for all user data are scoped by the returned user id, so the
 * cache is isolated per user and cleared on logout (see LogoutButton).
 */
export function useSessionUser() {
  return useQuery({
    queryKey: kvKeys.session,
    queryFn: fetchSessionUser,
    staleTime: SESSION_STALE_TIME,
    gcTime: 30 * 60_000,
  });
}