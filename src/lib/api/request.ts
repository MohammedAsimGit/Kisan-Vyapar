import type { NextRequest } from "next/server";
import { ValidationError } from "@/lib/errors";

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
}
