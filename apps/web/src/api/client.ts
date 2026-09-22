import type {
  CreateGuestbookRequest,
  DiagnosticsResponse,
  GuestbookEntry,
  GuestbookListResponse,
  HealthResponse,
  User,
} from "@site/shared";
import { API_BASE_PATH } from "@site/shared/constants";
import { ApiError } from "./errors";
import type { ClientErrorCode } from "./errors";
import { isDiagnostics, isGuestbookEntry, isGuestbookList, isHealth, isRecord, isUser, readServerError } from "./guards";

export const DEFAULT_TIMEOUT_MS = 8000;

export interface ApiClientOptions {
  /** Override fetch (tests). Defaults to the global fetch, looked up on every call. */
  readonly fetch?: typeof fetch;
  /** Per-request timeout including reading the body. Default 8 s. */
  readonly timeoutMs?: number;
  /** Path prefix. Default "/api" (same origin; Vite proxies it in dev). */
  readonly basePath?: string;
}

export interface RequestOptions {
  /** Abort the request from outside (for example the terminal's Ctrl+C). Rejects with code "aborted". */
  readonly signal?: AbortSignal;
}

export interface GuestbookListParams {
  readonly limit?: number;
  readonly before?: number;
}

export interface ApiClient {
  getHealth(options?: RequestOptions): Promise<HealthResponse>;
  login(username: string, password: string, options?: RequestOptions): Promise<User>;
  logout(options?: RequestOptions): Promise<void>;
  /** Resolves to the current user, or null when anonymous. */
  getMe(options?: RequestOptions): Promise<User | null>;
  listGuestbook(params?: GuestbookListParams, options?: RequestOptions): Promise<GuestbookListResponse>;
  createGuestbookEntry(entry: CreateGuestbookRequest, options?: RequestOptions): Promise<GuestbookEntry>;
  /** Operator only. */
  deleteGuestbookEntry(id: number, options?: RequestOptions): Promise<void>;
  /** Operator only. */
  getDiagnostics(options?: RequestOptions): Promise<DiagnosticsResponse>;
}

const GENERIC_MESSAGE: Record<"network_error" | "timeout" | "aborted", string> = {
  network_error: "Could not reach the API or it sent an unexpected response.",
  timeout: "The API did not answer in time.",
  aborted: "The request was cancelled.",
};

const clientError = (code: keyof typeof GENERIC_MESSAGE, status = 0, requestId?: string) =>
  new ApiError({ code, status, message: GENERIC_MESSAGE[code], requestId });

/** Retry-After as whole seconds, or undefined. Only the delta-seconds form is used by this API. */
function parseRetryAfter(value: string | null): number | undefined {
  if (value === null || !/^\d{1,7}$/.test(value.trim())) return undefined;
  return Number(value.trim());
}

function headerRequestId(res: Response): string | undefined {
  const value = res.headers.get("X-Request-Id");
  return value !== null && value !== "" ? value.slice(0, 128) : undefined;
}

interface RequestSpec<T> {
  readonly method: "GET" | "POST" | "DELETE";
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly body?: unknown;
  /** Validate and return the parsed 2xx JSON body, or undefined if it is not what the contract says. */
  readonly parse?: (json: unknown) => T | undefined;
  readonly signal: AbortSignal | undefined;
}

export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const basePath = options.basePath ?? API_BASE_PATH;

  async function request<T>(spec: RequestSpec<T>): Promise<T> {
    if (spec.signal?.aborted) throw clientError("aborted");

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const onExternalAbort = () => controller.abort();
    spec.signal?.addEventListener("abort", onExternalAbort, { once: true });

    // Why a failed attempt failed: our timer, the caller, or the network.
    const failure = (): ApiError =>
      clientError(timedOut ? "timeout" : spec.signal?.aborted ? "aborted" : "network_error");

    try {
      const query = spec.query && Object.keys(spec.query).length > 0 ? `?${new URLSearchParams(spec.query).toString()}` : "";
      const headers: Record<string, string> = { Accept: "application/json" };
      const init: RequestInit = {
        method: spec.method,
        credentials: "same-origin",
        cache: "no-store",
        headers,
        signal: controller.signal,
      };
      if (spec.body !== undefined) {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(spec.body);
      }

      // Race against the abort signal so a stalled fetch or body read (even one that ignores the
      // signal) still ends at the timeout or on a caller abort.
      const stopped = new Promise<never>((_resolve, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("stopped")), { once: true });
      });
      stopped.catch(() => undefined); // avoid an unhandled rejection when nothing is waiting on it

      let res: Response;
      let text: string;
      try {
        const exchange = (async () => {
          const response = await (options.fetch ?? globalThis.fetch)(`${basePath}${spec.path}${query}`, init);
          return { response, body: await response.text() };
        })();
        exchange.catch(() => undefined); // a late failure after we stopped waiting is expected
        const result = await Promise.race([exchange, stopped]);
        res = result.response;
        text = result.body;
      } catch {
        // Deliberately drop the underlying error: its text can echo URLs or internals.
        throw failure();
      }

      let json: unknown;
      let parsedJson = false;
      if (text !== "") {
        try {
          json = JSON.parse(text);
          parsedJson = true;
        } catch {
          // Not JSON (for example the dev proxy's bare 500 text/plain when the API is down).
        }
      }

      if (res.ok) {
        if (!spec.parse) return undefined as T; // 204 / no body expected
        const value = parsedJson ? spec.parse(json) : undefined;
        if (value === undefined) throw clientError("network_error", res.status, headerRequestId(res));
        return value;
      }

      const server = parsedJson ? readServerError(json) : undefined;
      if (!server) {
        // Empty, non-JSON or off-contract error body: treat as a generic network-style failure.
        throw clientError("network_error", res.status, headerRequestId(res));
      }
      throw new ApiError({
        code: server.code as ClientErrorCode,
        status: res.status,
        message: server.message,
        requestId: server.requestId ?? headerRequestId(res),
        retryAfter: parseRetryAfter(res.headers.get("Retry-After")),
        details: server.details,
      });
    } finally {
      clearTimeout(timer);
      spec.signal?.removeEventListener("abort", onExternalAbort);
    }
  }

  return {
    getHealth: (o) => request({ method: "GET", path: "/health", parse: (j) => (isHealth(j) ? j : undefined), signal: o?.signal }),

    login: (username, password, o) =>
      request({
        method: "POST",
        path: "/auth/login",
        body: { username, password },
        parse: (j) => (isUserEnvelope(j) ? j.user : undefined),
        signal: o?.signal,
      }),

    logout: (o) => request<void>({ method: "POST", path: "/auth/logout", signal: o?.signal }),

    getMe: (o) =>
      request<User | null>({
        method: "GET",
        path: "/auth/me",
        parse: (j) => (isMeEnvelope(j) ? j.user : undefined),
        signal: o?.signal,
      }),

    listGuestbook: (params, o) => {
      const query: Record<string, string> = {};
      if (params?.limit !== undefined) query.limit = String(params.limit);
      if (params?.before !== undefined) query.before = String(params.before);
      return request({
        method: "GET",
        path: "/guestbook",
        query,
        parse: (j) => (isGuestbookList(j) ? { items: j.items, nextBefore: j.nextBefore } : undefined),
        signal: o?.signal,
      });
    },

    createGuestbookEntry: (entry, o) =>
      request({
        method: "POST",
        path: "/guestbook",
        body: { handle: entry.handle, message: entry.message },
        parse: (j) => (isEntryEnvelope(j) ? j.entry : undefined),
        signal: o?.signal,
      }),

    deleteGuestbookEntry: (id, o) => {
      // The id goes into the URL path, so it must be a plain positive integer. This is path safety,
      // not content validation (the server still validates and is the authority).
      if (!Number.isSafeInteger(id) || id < 1) {
        return Promise.reject(new ApiError({ code: "validation_error", status: 0, message: "id must be a positive integer" }));
      }
      return request<void>({ method: "DELETE", path: `/admin/guestbook/${id}`, signal: o?.signal });
    },

    getDiagnostics: (o) =>
      request({ method: "GET", path: "/admin/diagnostics", parse: (j) => (isDiagnostics(j) ? j : undefined), signal: o?.signal }),
  };
}

const isUserEnvelope = (j: unknown): j is { user: User } => isRecord(j) && isUser(j.user);
const isMeEnvelope = (j: unknown): j is { user: User | null } => isRecord(j) && (j.user === null || isUser(j.user));
const isEntryEnvelope = (j: unknown): j is { entry: GuestbookEntry } => isRecord(j) && isGuestbookEntry(j.entry);

/** Shared default instance for the app. Tests build their own with a mocked fetch. */
export const api: ApiClient = createApiClient();
