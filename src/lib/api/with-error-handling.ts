import { NextResponse } from "next/server";
import { isAppError, toErrorEnvelope } from "@/lib/errors";

const shouldLog = (error: unknown): boolean =>
  !isAppError(error) || error.statusCode >= 500;

export async function withErrorHandling(
  handler: () => Promise<NextResponse | Response>,
): Promise<NextResponse | Response> {
  try {
    return await handler();
  } catch (error) {
    if (shouldLog(error)) {
      console.error("[api] unhandled error:", error);
    }
    const { status, body } = toErrorEnvelope(error);
    return NextResponse.json(body, { status });
  }
}
