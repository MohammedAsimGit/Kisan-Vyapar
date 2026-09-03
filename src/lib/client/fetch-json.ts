export interface ValidationIssue {
  path?: Array<string | number>;
  message?: string;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly issues?: ValidationIssue[];

  constructor(
    message: string,
    status: number,
    code?: string,
    issues?: ValidationIssue[],
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

interface ApiEnvelope {
  data?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: ValidationIssue[];
  };
}

function describeError(envelope: ApiEnvelope | undefined): {
  message: string;
  issues?: ValidationIssue[];
} {
  const issues = envelope?.error?.details?.filter(
    (issue) => typeof issue?.message === "string" && issue.message.length > 0,
  );

  if (issues && issues.length > 0) {
    const fieldLabels = new Map<string, string>([
      ["fullName", "Name"],
      ["phone", "Mobile number"],
      ["email", "Email"],
      ["password", "Password"],
      ["role", "Role"],
      ["businessName", "Business name"],
      ["businessType", "Business type"],
      ["district", "District"],
      ["state", "State"],
    ]);

    const readable = issues
      .slice(0, 2)
      .map((issue) => {
        const field = Array.isArray(issue.path)
          ? String(issue.path[0] ?? "")
          : "";
        const label = fieldLabels.get(field) ?? (field ? `Field "${field}"` : "");
        return label ? `${label}: ${issue.message}` : issue.message;
      })
      .join(" ");

    if (readable) {
      return { message: readable, issues };
    }
  }

  return {
    message:
      envelope?.error?.message ?? "Something went wrong. Please try again.",
    issues,
  };
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
    const { message, issues } = describeError(envelope);
    throw new ApiRequestError(
      message,
      response.status,
      envelope?.error?.code,
      issues,
    );
  }

  return (envelope?.data ?? null) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
  });
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: "GET" });
}
