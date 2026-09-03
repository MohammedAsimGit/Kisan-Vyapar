import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/config/env";
import { withErrorHandling } from "@/lib/api";
import { pingDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET(): Promise<NextResponse | Response> {
  return withErrorHandling(async () => {
    const db = await pingDatabase();

    if (!db.ok) {
      console.error("[health] database ping failed:", db.message);
    }

    const body = {
      data: {
        status: db.ok ? "ok" : "degraded",
        services: {
          database: {
            configured: isDatabaseConfigured(),
            reachable: db.ok,
          },
        },
      },
    };

    const status = db.ok || !isDatabaseConfigured() ? 200 : 503;
    return NextResponse.json(body, { status });
  });
}
