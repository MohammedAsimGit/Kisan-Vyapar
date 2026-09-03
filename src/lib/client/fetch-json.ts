export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

interface ApiEnvelope {
  data?: unknown;
  error?: { code?: string; message?: string };
}

async function requestJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  let envelope: ApiEnvelope | undefined;
  try {
    envelope = (await response.json()) as ApiEnvelope;
  } catch {
    envelope = undefined;
  }

  if (!response.ok) {
    const message =
      envelope?.error?.message ?? "Something went wrong. Please try again.";
    throw new ApiRequestError(message, response.status, envelope?.error?.code);
  }

  return (envelope?.data ?? null) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: "GET" });
}
