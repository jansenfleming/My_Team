import type { FastifyPluginAsync } from "fastify";
import rateLimit from "@fastify/rate-limit";
import {
  API_BASE_PATH,
  CreateGuestbookRequestSchema,
  GuestbookQuerySchema,
  RATE_LIMITS,
  type CreateGuestbookResponse,
  type GuestbookListResponse,
} from "@site/shared";
import type { Db } from "../db/connection";
import { insertGuestbookEntry, listGuestbookEntries } from "../db/guestbook-repo";
import { ApiHttpError } from "../errors";

/** GET/POST /api/guestbook (both public; contract section 6). */
export const guestbookRoutes: FastifyPluginAsync<{ db: Db }> = async (app, { db }) => {
  app.get(`${API_BASE_PATH}/guestbook`, async (request): Promise<GuestbookListResponse> => {
    const query = GuestbookQuerySchema.parse(request.query);
    return listGuestbookEntries(db, query.limit, query.before);
  });

  // A private encapsulation scope so this plugin's own `rateLimitRan` request marker is distinct
  // from the app-wide global limiter's (both are @fastify/rate-limit `onRequest` hooks; sharing the
  // marker would make the second one a no-op — confirmed by hand before writing this). `global:
  // true` here applies only to the one route registered inside this scope, in addition to (not
  // instead of) the app-wide global limit from app.ts.
  await app.register(async (scoped) => {
    await scoped.register(rateLimit, {
      global: true,
      max: RATE_LIMITS.guestbookPost.max,
      timeWindow: RATE_LIMITS.guestbookPost.windowMs,
      errorResponseBuilder: () => new ApiHttpError("rate_limited"),
    });

    scoped.post(`${API_BASE_PATH}/guestbook`, async (request, reply): Promise<CreateGuestbookResponse> => {
      const body = CreateGuestbookRequestSchema.parse(request.body);
      const entry = insertGuestbookEntry(db, body.handle, body.message);
      reply.code(201);
      return { entry };
    });
  });
};
