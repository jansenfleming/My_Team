// Contract error format (api-contract.md section 2). Every non-2xx body is built here, so no
// route or hook can leak a raw message, stack trace, SQL or path.
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import {
  ERROR_HTTP_STATUS,
  toValidationDetails,
  type ApiError,
  type ErrorCode,
  type ValidationDetail,
} from "@site/shared";

/** Fixed, generic, safe messages. Never built from input. */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  validation_error: "The request is invalid.",
  invalid_credentials: "Invalid username or password.",
  unauthenticated: "Authentication required.",
  origin_rejected: "Request origin is not allowed.",
  forbidden: "You are not allowed to do that.",
  not_found: "Not found.",
  payload_too_large: "Request body is too large.",
  unsupported_media_type: "Content-Type must be application/json.",
  rate_limited: "Too many requests. Try again later.",
  unavailable: "Service temporarily unavailable.",
  internal_error: "Internal server error.",
};

/** Throw this from a route or hook to send a contract error. */
export class ApiHttpError extends Error {
  constructor(
    readonly apiCode: ErrorCode,
    readonly details?: ValidationDetail[],
  ) {
    super(apiCode);
    this.name = "ApiHttpError";
  }
}

export function buildErrorBody(code: ErrorCode, requestId: string, details?: ValidationDetail[]): ApiError {
  return {
    error: {
      code,
      message: ERROR_MESSAGES[code],
      requestId,
      // `details` exists only for validation_error (contract).
      ...(code === "validation_error" && details && details.length > 0 ? { details } : {}),
    },
  };
}

export type MappedError = { code: ErrorCode; details?: ValidationDetail[] };

/** Classify anything that can reach an error handler. Unknown errors become internal_error. */
export function mapError(error: unknown): MappedError {
  if (error instanceof ApiHttpError) return { code: error.apiCode, details: error.details };
  if (error instanceof ZodError) return { code: "validation_error", details: toValidationDetails(error) };
  const status = (error as { statusCode?: unknown } | null)?.statusCode;
  if (typeof status === "number") {
    if (status === 404) return { code: "not_found" };
    if (status === 413) return { code: "payload_too_large" };
    if (status === 415) return { code: "unsupported_media_type" };
    if (status === 429) return { code: "rate_limited" };
    // Other client errors from the framework (bad JSON, empty JSON body, bad content-length, bad URL).
    if (status >= 400 && status < 500) return { code: "validation_error" };
  }
  return { code: "internal_error" };
}

export function sendError(
  reply: FastifyReply,
  request: Pick<FastifyRequest, "id">,
  code: ErrorCode,
  details?: ValidationDetail[],
): FastifyReply {
  return reply
    .code(ERROR_HTTP_STATUS[code])
    .header("X-Request-Id", request.id)
    .type("application/json; charset=utf-8")
    .send(buildErrorBody(code, request.id, details));
}
