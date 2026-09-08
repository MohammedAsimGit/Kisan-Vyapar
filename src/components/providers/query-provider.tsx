"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { getQueryClient } from "@/lib/client/query-client";

/**
 * Mounted once at the root layout so the in-memory query cache survives
 * client-side navigation between app screens. `useState` keeps the same
 * client instance for the life of the app session.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}