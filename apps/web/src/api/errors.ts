import type { ErrorCode, ValidationDetail } from "@site/shared";

/**
 * Every code an ApiError can carry: the contract's server codes, plus three the client makes up
 * when there is no usable server error body (all with status 0 except network_error, which keeps
 * the HTTP status when a server or proxy answered with something that is not the contract's error).
 */
export type ClientErrorCode = ErrorCode | "network_error" | "timeout" | "aborted";

export interface ApiErrorInit {
  readonly code: ClientErrorCode;
  /** HTTP status, or 0 when no response was received. */
  readonly status: number;
  readonly message: string;
  readonly requestId?: string | undefined;
  /** Seconds from the Retry-After header (rate limits). */
  readonly retryAfter?: number | undefined;
  readonly details?: readonly ValidationDetail[] | undefined;
}

/**
 * The one error type the client throws. Callers branch on `code`, not on `message`: the message is
 * a developer-facing default (server errors carry the server's safe generic text). It never holds
 * request or response bodies, the password, or the underlying fetch error's text.
 */
export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly code: ClientErrorCode;
  readonly status: number;
  readonly requestId: string | undefined;
  readonly retryAfter: number | undefined;
  readonly details: readonly ValidationDetail[] | undefined;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.code = init.code;
    this.status = init.status;
    this.requestId = init.requestId;
    this.retryAfter = init.retryAfter;
    this.details = init.details;
  }

  /** True when the API could not be reached or answered with something that is not the contract. */
  get isNetworkFailure(): boolean {
    return this.code === "network_error" || this.code === "timeout";
  }
}
