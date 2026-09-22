// Light runtime checks for response bodies. zod stays out of the browser bundle (ADR 0001), so
// these check shape and primitive types only. The server is the authority on the character
// rules (handle and message charsets), so nothing here repeats them.
import type { DiagnosticsResponse, GuestbookEntry, GuestbookListResponse, HealthResponse, User } from "@site/shared";
import { ERROR_CODES } from "@site/shared/constants";
import type { ErrorCode } from "@site/shared/constants";

const ERROR_CODE_SET: ReadonlySet<string> = new Set(ERROR_CODES);

export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isPositiveInt = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const isString = (v: unknown): v is string => typeof v === "string";

export function isUser(v: unknown): v is User {
  return isRecord(v) && isString(v.username) && v.role === "operator";
}

export function isGuestbookEntry(v: unknown): v is GuestbookEntry {
  return isRecord(v) && isPositiveInt(v.id) && isString(v.handle) && isString(v.message) && isString(v.createdAt);
}

export function isGuestbookList(v: unknown): v is GuestbookListResponse {
  return (
    isRecord(v) &&
    Array.isArray(v.items) &&
    v.items.every(isGuestbookEntry) &&
    (v.nextBefore === null || isPositiveInt(v.nextBefore))
  );
}

export function isHealth(v: unknown): v is HealthResponse {
  return isRecord(v) && v.status === "ok" && isString(v.version) && isString(v.contract) && isString(v.time);
}

export function isDiagnostics(v: unknown): v is DiagnosticsResponse {
  return (
    isRecord(v) &&
    isCount(v.uptimeSeconds) &&
    isString(v.startedAt) &&
    isString(v.nodeVersion) &&
    v.db === "ok" &&
    isCount(v.guestbookCount) &&
    isCount(v.activeSessions)
  );
}

export interface ServerErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly requestId: string | undefined;
  readonly details: { path: string; message: string }[] | undefined;
}

/** Extract the contract's `{ error: { code, message, requestId, details? } }`, or undefined. */
export function readServerError(v: unknown): ServerErrorBody | undefined {
  if (!isRecord(v) || !isRecord(v.error)) return undefined;
  const { code, message, requestId, details } = v.error;
  if (!isString(code) || !ERROR_CODE_SET.has(code) || !isString(message) || message === "") return undefined;
  const cleanDetails = Array.isArray(details)
    ? details.flatMap((d): { path: string; message: string }[] =>
        isRecord(d) && isString(d.path) && isString(d.message) ? [{ path: d.path, message: d.message }] : [],
      )
    : undefined;
  return {
    code: code as ErrorCode,
    message: message.slice(0, 200),
    requestId: isString(requestId) && requestId !== "" ? requestId.slice(0, 128) : undefined,
    details: cleanDetails,
  };
}
