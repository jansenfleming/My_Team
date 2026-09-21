// Constants from docs/architecture/api-contract.md (v1.0). This file has NO imports so the web
// app can `import { HANDLE_MAX } from "@site/shared/constants"` without pulling in zod.

/** Contract version reported by GET /api/health (`contract`). */
export const CONTRACT_VERSION = "1.0";
/** Base path of every route (contract section 1). */
export const API_BASE_PATH = "/api";

// Section 5: text and paging limits. Lengths count UTF-16 code units (JS `.length`).
export const HANDLE_MIN = 2;
export const HANDLE_MAX = 24;
export const MESSAGE_MAX = 280;
export const GUESTBOOK_PAGE_DEFAULT = 20;
export const GUESTBOOK_PAGE_MAX = 50;
export const USERNAME_MAX = 64;
export const PASSWORD_MAX = 256;

/** Guestbook handle charset (section 6, POST /api/guestbook). Not global/sticky, safe to reuse. */
export const HANDLE_PATTERN = /^[A-Za-z0-9_-]+$/;
/**
 * Characters a guestbook message must not contain (contract section 6, POST /api/guestbook):
 * every control character (\p{Cc}: C0, DEL, C1; includes newline, tab, NUL), lone surrogates
 * (\p{Cs}; valid surrogate pairs are single code points and are fine), the line and paragraph
 * separators U+2028/U+2029, the bidi overrides and isolates U+202A-U+202E and U+2066-U+2069, and
 * the bidi marks U+200E, U+200F, U+061C. Zero-width joiners (U+200B, U+200D) stay allowed so
 * emoji sequences work. Not global/sticky, safe to reuse.
 */
export const MESSAGE_FORBIDDEN_PATTERN = /[\p{Cc}\p{Cs}\u2028\u2029\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/u;

// Section 1: request body limit (413 payload_too_large above this).
export const BODY_LIMIT_BYTES = 4096;

// Section 3: session cookie.
export const SESSION_COOKIE_NAME = "sid";
export const SESSION_MAX_AGE_SECONDS = 28800;

// Section 4: rate limits per client IP.
export const RATE_LIMITS = {
  global: { max: 120, windowMs: 60_000 },
  login: { max: 5, windowMs: 60_000 },
  guestbookPost: { max: 3, windowMs: 600_000 },
} as const;

// Section 3: roles.
export const ROLES = ["operator"] as const;
export type Role = (typeof ROLES)[number];

// Section 2: error codes and their HTTP status.
export const ERROR_CODES = [
  "validation_error",
  "invalid_credentials",
  "unauthenticated",
  "origin_rejected",
  "forbidden",
  "not_found",
  "payload_too_large",
  "unsupported_media_type",
  "rate_limited",
  "unavailable",
  "internal_error",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_HTTP_STATUS = {
  validation_error: 400,
  invalid_credentials: 401,
  unauthenticated: 401,
  origin_rejected: 403,
  forbidden: 403,
  not_found: 404,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  unavailable: 503,
  internal_error: 500,
} as const satisfies Record<ErrorCode, number>;
