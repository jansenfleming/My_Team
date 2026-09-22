// Hard guard: every base URL the harness or a gate test touches must be loopback. This is the one
// place that decides "local", so a mistyped or attacker-influenced host cannot send QA's traffic
// anywhere else (project brief: "authorized testing only, against this project's own code and its
// own local instance on localhost").
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

export class NonLocalUrlError extends Error {
  constructor(readonly url: string) {
    super(`refusing non-loopback URL: ${url}`);
    this.name = "NonLocalUrlError";
  }
}

/** Throws NonLocalUrlError unless the URL's host is 127.0.0.1, localhost, or ::1. */
export function assertLocalUrl(input: string | URL): URL {
  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : input;
  } catch {
    throw new NonLocalUrlError(String(input));
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new NonLocalUrlError(url.toString());
  if (!LOOPBACK_HOSTS.has(url.hostname)) throw new NonLocalUrlError(url.toString());
  return url;
}

/** True/false instead of throwing, for call sites that want to branch rather than fail. */
export function isLocalUrl(input: string | URL): boolean {
  try {
    assertLocalUrl(input);
    return true;
  } catch {
    return false;
  }
}
