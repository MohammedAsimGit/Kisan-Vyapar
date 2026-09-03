import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, { ...init, status: init?.status ?? 201 });
}

export function noContent(init?: ResponseInit): NextResponse {
  return new NextResponse(null, { ...init, status: init?.status ?? 204 });
}
