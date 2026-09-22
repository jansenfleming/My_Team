// Small HTTP helper for black-box tests: a cookie jar (so a login can be followed by an
// authenticated request the way a browser would) and a hard guard that refuses any base URL that
// is not loopback. Deliberately independent of the app-under-test's own client (apps/web/src/api):
// QA verifies the contract from the outside, not through the code it is testing.
import { assertLocalUrl } from "./guard";

export interface HttpResponse {
  readonly status: number;
  readonly headers: Headers;
  readonly text: string;
  /** Parsed JSON body, or undefined if the body was empty or not valid JSON. */
  readonly json: unknown;
}

export interface RequestOptions {
  readonly method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  readonly headers?: Readonly<Record<string, string>>;
  readonly query?: Readonly<Record<string, string | number | undefined>>;
  /** Sent as JSON (Content-Type set automatically) unless it is already a string. */
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  /** Skip the cookie jar for this one request (send no stored cookie, store nothing from the response). */
  readonly skipCookieJar?: boolean;
}

export interface HttpClient {
  readonly baseUrl: string;
  request(path: string, options?: RequestOptions): Promise<HttpResponse>;
  get(path: string, options?: Omit<RequestOptions, "method">): Promise<HttpResponse>;
  post(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<HttpResponse>;
  del(path: string, options?: Omit<RequestOptions, "method">): Promise<HttpResponse>;
  /** Current jar contents (name -> value) for the client's own origin. */
  cookies(): ReadonlyMap<string, string>;
  /** Empty the jar without creating a new client (simulates a fresh, logged-out browser). */
  clearCookies(): void;
}

/** Minimal Set-Cookie parser: name, value and the Max-Age=0 / an expiry in the past (deletion). Ignores attributes otherwise. */
function applySetCookie(jar: Map<string, string>, setCookieValues: readonly string[]): void {
  for (const raw of setCookieValues) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const eq = pair?.indexOf("=") ?? -1;
    if (!pair || eq < 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    const maxAge = attrs.find((a) => a.toLowerCase().startsWith("max-age="));
    const expires = attrs.find((a) => a.toLowerCase().startsWith("expires="));
    const deleted =
      (maxAge && Number(maxAge.split("=")[1]) <= 0) || (expires && new Date(expires.split("=").slice(1).join("=")).getTime() <= Date.now());
    if (deleted) jar.delete(name);
    else jar.set(name, value);
  }
}

function cookieHeader(jar: Map<string, string>): string | undefined {
  if (jar.size === 0) return undefined;
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

export function createHttpClient(baseUrl: string): HttpClient {
  assertLocalUrl(baseUrl);
  const jar = new Map<string, string>();

  async function request(path: string, options: RequestOptions = {}): Promise<HttpResponse> {
    const url = assertLocalUrl(new URL(path, baseUrl));
    if (options.query) {
      for (const [k, v] of Object.entries(options.query)) if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const headers = new Headers(options.headers);
    if (!options.skipCookieJar) {
      const cookie = cookieHeader(jar);
      if (cookie !== undefined && !headers.has("Cookie")) headers.set("Cookie", cookie);
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      if (typeof options.body === "string") {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      }
    }

    const res = await fetch(url, { method: options.method ?? "GET", headers, body, signal: options.signal, redirect: "manual" });
    const text = await res.text();

    if (!options.skipCookieJar) {
      const setCookie = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
      if (setCookie.length > 0) applySetCookie(jar, setCookie);
    }

    let json: unknown;
    if (text !== "") {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }
    return { status: res.status, headers: res.headers, text, json };
  }

  return {
    baseUrl,
    request,
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    del: (path, options) => request(path, { ...options, method: "DELETE" }),
    cookies: () => new Map(jar),
    clearCookies: () => jar.clear(),
  };
}
