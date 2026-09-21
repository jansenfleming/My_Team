// Zod 4 schemas for every request, query, params and response body in
// docs/architecture/api-contract.md sections 2, 5 and 6 (v1.0). The contract wins over this file.
//
// Conventions:
// - Object schemas strip unknown keys (zod default). Requests: mass-assignment attempts such as an
//   extra `id` never reach the handler. Responses: additive-only contract, clients ignore extras.
// - Every custom message is fixed text and never echoes the input.
// - Lengths count UTF-16 code units (JS `.length`), the same as HTML `maxlength`.
import { z } from "zod";
import {
  ERROR_CODES,
  GUESTBOOK_PAGE_DEFAULT,
  GUESTBOOK_PAGE_MAX,
  HANDLE_MAX,
  HANDLE_MIN,
  HANDLE_PATTERN,
  MESSAGE_FORBIDDEN_PATTERN,
  MESSAGE_INVISIBLE_RUN_PATTERN,
  MESSAGE_MAX,
  MESSAGE_VISIBLE_PATTERN,
  PASSWORD_MAX,
  ROLES,
  USERNAME_MAX,
} from "./constants";

// ---------------------------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------------------------

/** ISO-8601 UTC timestamp with milliseconds, e.g. 2026-09-21T17:00:00.000Z. */
export const TimestampSchema = z.iso.datetime({
  precision: 3,
  error: "must be an ISO-8601 UTC timestamp with milliseconds",
});

/** Positive integer id as it appears in JSON bodies. */
export const IdSchema = z
  .number({ error: "must be a positive integer" })
  .int({ error: "must be a positive integer" })
  .min(1, { error: "must be a positive integer" });

/**
 * Length predicate in UTF-16 code units (JS `.length`), as the contract specifies. Zod 4's own
 * `.min()/.max()` on strings count Unicode code points instead, so they are NOT used for text
 * (a test pins this: 141 emoji are 282 code units and must be rejected).
 */
const unitLength = (min: number, max: number) => (s: string) => s.length >= min && s.length <= max;

/**
 * Positive integer as it arrives in a URL (query string or path param): a plain digit string.
 * No coercion, so "", " ", "0", "-1", "1.5", "1e3", "0x10" and arrays (repeated params) all fail.
 */
const positiveIntFromUrl = (max: number, what: string) =>
  z
    .string({ error: `${what} must be a positive integer` })
    .regex(/^[0-9]{1,16}$/, { error: `${what} must be a positive integer` })
    .transform(Number)
    .pipe(
      z
        .number()
        .int({ error: `${what} must be a positive integer` })
        .min(1, { error: `${what} must be a positive integer` })
        .max(max, { error: `${what} must be at most ${max}` }),
    );

// ---------------------------------------------------------------------------------------------
// Section 5: shared types
// ---------------------------------------------------------------------------------------------

export const RoleSchema = z.enum(ROLES);

export const UserSchema = z.object({
  username: z.string().refine(unitLength(1, USERNAME_MAX)),
  role: RoleSchema,
});

/** 2..24 chars of [A-Za-z0-9_-]. Not trimmed: a leading or trailing space is rejected. */
export const HandleSchema = z
  .string({ error: "handle must be a string" })
  .refine(unitLength(HANDLE_MIN, HANDLE_MAX), {
    error: `handle must be ${HANDLE_MIN} to ${HANDLE_MAX} characters`,
  })
  .regex(HANDLE_PATTERN, { error: "handle may only contain letters, digits, underscore and hyphen" });

/**
 * 1..280 chars after trimming, single line, at least one visible character, no run of more than
 * 3 invisible characters. Order matters: the forbidden-character and invisible-run checks run on
 * the RAW input (so "hi\n" is rejected, not silently trimmed), then the value is trimmed, then the
 * length and visibility are checked. The parsed output is the trimmed string, which is what gets
 * stored.
 */
export const MessageSchema = z
  .string({ error: "message must be a string" })
  .refine((s) => !MESSAGE_FORBIDDEN_PATTERN.test(s), {
    error: "message must be a single line without control, bidirectional or invalid characters",
    abort: true,
  })
  .refine((s) => !MESSAGE_INVISIBLE_RUN_PATTERN.test(s), {
    error: "message must not contain a long run of invisible characters",
    abort: true,
  })
  .trim()
  .refine(unitLength(1, MESSAGE_MAX), {
    error: `message must be 1 to ${MESSAGE_MAX} characters`,
    abort: true,
  })
  .refine((s) => MESSAGE_VISIBLE_PATTERN.test(s), {
    error: "message must contain at least one visible character",
  });

export const GuestbookEntrySchema = z.object({
  id: IdSchema,
  handle: HandleSchema,
  message: MessageSchema,
  createdAt: TimestampSchema,
});

// ---------------------------------------------------------------------------------------------
// Section 2: error format
// ---------------------------------------------------------------------------------------------

export const ErrorCodeSchema = z.enum(ERROR_CODES);

export const ValidationDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const ApiErrorSchema = z.object({
  error: z
    .object({
      code: ErrorCodeSchema,
      message: z.string().min(1),
      requestId: z.string().min(1),
      details: z.array(ValidationDetailSchema).optional(),
    })
    .refine((e) => e.details === undefined || e.code === "validation_error", {
      error: "details is only allowed for validation_error",
      path: ["details"],
    }),
});

// ---------------------------------------------------------------------------------------------
// Section 6: endpoints
// ---------------------------------------------------------------------------------------------

// GET /api/health
export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  version: z.string().min(1),
  contract: z.string().min(1),
  time: TimestampSchema,
});

// POST /api/auth/login
export const LoginRequestSchema = z.object({
  username: z
    .string({ error: "username must be a string" })
    .refine(unitLength(1, USERNAME_MAX), { error: `username must be 1 to ${USERNAME_MAX} characters` }),
  // Never trimmed or otherwise altered.
  password: z
    .string({ error: "password must be a string" })
    .refine(unitLength(1, PASSWORD_MAX), { error: `password must be 1 to ${PASSWORD_MAX} characters` }),
});
export const LoginResponseSchema = z.object({ user: UserSchema });

// GET /api/auth/me
export const MeResponseSchema = z.object({ user: UserSchema.nullable() });

// GET /api/guestbook?limit=&before=  (URL values are strings)
export const GuestbookQuerySchema = z.object({
  limit: positiveIntFromUrl(GUESTBOOK_PAGE_MAX, "limit").default(GUESTBOOK_PAGE_DEFAULT),
  before: positiveIntFromUrl(Number.MAX_SAFE_INTEGER, "before").optional(),
});
export const GuestbookListResponseSchema = z.object({
  items: z.array(GuestbookEntrySchema),
  nextBefore: IdSchema.nullable(),
});

// POST /api/guestbook
export const CreateGuestbookRequestSchema = z.object({
  handle: HandleSchema,
  message: MessageSchema,
});
export const CreateGuestbookResponseSchema = z.object({ entry: GuestbookEntrySchema });

// DELETE /api/admin/guestbook/:id  (path params are strings)
export const GuestbookIdParamsSchema = z.object({
  id: positiveIntFromUrl(Number.MAX_SAFE_INTEGER, "id"),
});

// GET /api/admin/diagnostics
export const DiagnosticsResponseSchema = z.object({
  uptimeSeconds: z.number().int().min(0),
  startedAt: TimestampSchema,
  nodeVersion: z.string().min(1),
  db: z.literal("ok"),
  guestbookCount: z.number().int().min(0),
  activeSessions: z.number().int().min(0),
});

// ---------------------------------------------------------------------------------------------
// Inferred types (import type these; zero runtime cost)
// ---------------------------------------------------------------------------------------------

export type User = z.infer<typeof UserSchema>;
export type GuestbookEntry = z.infer<typeof GuestbookEntrySchema>;
export type ValidationDetail = z.infer<typeof ValidationDetailSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type MeResponse = z.infer<typeof MeResponseSchema>;
/** Parsed query (numbers). The wire form is `z.input<typeof GuestbookQuerySchema>` (strings). */
export type GuestbookQuery = z.infer<typeof GuestbookQuerySchema>;
export type GuestbookListResponse = z.infer<typeof GuestbookListResponseSchema>;
export type CreateGuestbookRequest = z.infer<typeof CreateGuestbookRequestSchema>;
export type CreateGuestbookResponse = z.infer<typeof CreateGuestbookResponseSchema>;
export type GuestbookIdParams = z.infer<typeof GuestbookIdParamsSchema>;
export type DiagnosticsResponse = z.infer<typeof DiagnosticsResponseSchema>;

// ---------------------------------------------------------------------------------------------
// Validation error helper
// ---------------------------------------------------------------------------------------------

const MAX_DETAILS = 10;
const MAX_DETAIL_MESSAGE = 200;

/**
 * Turns a ZodError into the contract's `details` array. Only schema-defined (fixed) messages and
 * field paths are used, never the offending input value. Capped so an attacker cannot inflate the
 * response.
 */
export function toValidationDetails(error: z.ZodError): ValidationDetail[] {
  const seen = new Set<string>();
  const out: ValidationDetail[] = [];
  for (const issue of error.issues) {
    const path = issue.path.map(String).join(".");
    const message = issue.message.slice(0, MAX_DETAIL_MESSAGE);
    const key = `${path}\u0000${message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ path, message });
    if (out.length >= MAX_DETAILS) break;
  }
  return out;
}
