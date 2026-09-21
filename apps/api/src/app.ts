// Fastify app factory. `buildApp(config)` returns an un-started instance so tests can add routes
// and use `inject()` without opening a port.
import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { BODY_LIMIT_BYTES, RATE_LIMITS } from "@site/shared";
import type { Config } from "./config";
import { ApiHttpError, mapError, sendError } from "./errors";
import { healthRoutes, type HealthCheck } from "./routes/health";

export type AppDeps = {
  /** Dependency checks for /api/health (B3 adds the database). A `false` or a throw gives 503. */
  healthChecks?: readonly HealthCheck[];
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function buildApp(config: Config, deps: AppDeps = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      // Belt and braces for later tasks (auth); the full redaction test lands in B6.
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
        censor: "[redacted]",
      },
    },
    // Our own ids only: an attacker-chosen X-Request-Id must never reach logs or responses.
    requestIdHeader: false,
    genReqId: () => randomUUID(),
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: config.trustProxy,
    // Slow-request hardening; generous for a JSON API on localhost.
    requestTimeout: 15_000,
    keepAliveTimeout: 5_000,
    // Errors raised before routing (for example a malformed URL) still use the contract body.
    frameworkErrors: (error, request, reply) => {
      const { code, details } = mapError(error);
      sendError(reply, request, code, details);
    },
  });

  // JSON only (contract section 1): Fastify also ships a text/plain parser; remove it so any other
  // content type with a body is a 415.
  app.removeContentTypeParser("text/plain");

  // 1. Request id on every response, including errors raised by later hooks.
  app.addHook("onRequest", async (request, reply) => {
    reply.header("X-Request-Id", request.id);
  });

  // 2. Security headers. This API only returns JSON, so the CSP is fully locked down.
  await app.register(helmet, {
    // `useDefaults: false`: exactly these two directives, not helmet's web-page defaults.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
    frameguard: { action: "deny" },
    referrerPolicy: { policy: "no-referrer" },
  });

  // 3. Global rate limit per client IP (`req.ip`; X-Forwarded-For only if TRUST_PROXY=true). Applied
  // as an app-level onRequest hook (not per route) so unknown routes and requests rejected by the
  // Origin check below are counted too. Per-route limits (login, guestbook) come in later tasks.
  await app.register(rateLimit, {
    global: false,
    max: RATE_LIMITS.global.max,
    timeWindow: RATE_LIMITS.global.windowMs,
    // The plugin sets Retry-After itself and throws this; our error handler formats it.
    errorResponseBuilder: () => new ApiHttpError("rate_limited"),
  });
  app.addHook("onRequest", app.rateLimit());

  // 4. CSRF layer 2: Origin / Sec-Fetch-Site check on every mutating request. Requests without an
  // Origin header (curl, tests) pass here; operator routes still need a valid session cookie.
  const allowedOrigins = new Set(config.webOrigins);
  app.addHook("onRequest", async (request) => {
    if (!MUTATING_METHODS.has(request.method)) return;
    const origin = request.headers.origin;
    if (origin !== undefined && !allowedOrigins.has(origin)) throw new ApiHttpError("origin_rejected");
    if (request.headers["sec-fetch-site"]?.toLowerCase() === "cross-site") {
      throw new ApiHttpError("origin_rejected");
    }
  });

  // Contract error handling: every non-2xx body is built in errors.ts.
  app.setErrorHandler((error, request, reply) => {
    const { code, details } = mapError(error);
    if (code === "internal_error") {
      // Details only in server logs (the response stays generic).
      request.log.error({ err: error }, "unhandled error");
    }
    return sendError(reply, request, code, details);
  });
  app.setNotFoundHandler((request, reply) => sendError(reply, request, "not_found"));

  await app.register(healthRoutes, { checks: deps.healthChecks ?? [] });

  return app;
}
