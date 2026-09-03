export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND_ERROR"
  | "CONFLICT_ERROR"
  | "CONFIGURATION_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    options?: { details?: unknown; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request contains invalid input.", details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, { details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication is required to perform this action.") {
    super(message, "AUTHENTICATION_ERROR", 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You are not allowed to perform this action.") {
    super(message, "AUTHORIZATION_ERROR", 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, "NOT_FOUND_ERROR", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state of the resource.") {
    super(message, "CONFLICT_ERROR", 409);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string, options?: { details?: unknown; cause?: unknown }) {
    super(message, "CONFIGURATION_ERROR", 500, options);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: { details?: unknown; cause?: unknown }) {
    super(message, "DATABASE_ERROR", 500, options);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, options?: { details?: unknown; cause?: unknown }) {
    super(message, "EXTERNAL_SERVICE_ERROR", 502, options);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
