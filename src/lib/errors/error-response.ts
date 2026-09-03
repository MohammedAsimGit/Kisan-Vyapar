import { isAppError } from "./error-types";

export interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ErrorEnvelope {
  error: ErrorBody;
}

const GENERIC_MESSAGE =
  "An unexpected error occurred. Please try again later.";

const isExposable = (statusCode: number): boolean => statusCode < 500;

export function getHttpStatus(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  return 500;
}

export function toErrorEnvelope(error: unknown): {
  status: number;
  body: ErrorEnvelope;
} {
  if (isAppError(error)) {
    const message = isExposable(error.statusCode)
      ? error.message
      : GENERIC_MESSAGE;

    const body: ErrorBody = { code: error.code, message };

    if (isExposable(error.statusCode) && error.details !== undefined) {
      body.details = error.details;
    }

    return { status: error.statusCode, body: { error: body } };
  }

  return {
    status: 500,
    body: { error: { code: "INTERNAL_ERROR", message: GENERIC_MESSAGE } },
  };
}
