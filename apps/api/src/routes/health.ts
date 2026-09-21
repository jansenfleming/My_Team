import type { FastifyPluginAsync } from "fastify";
import { API_BASE_PATH, CONTRACT_VERSION, type HealthResponse } from "@site/shared";
import { ApiHttpError } from "../errors";
import { APP_VERSION } from "../version";

export type HealthCheck = () => boolean | Promise<boolean>;

/** GET /api/health (public). 503 `unavailable` if any dependency check fails or throws. */
export const healthRoutes: FastifyPluginAsync<{ checks: readonly HealthCheck[] }> = async (app, opts) => {
  app.get(`${API_BASE_PATH}/health`, async (): Promise<HealthResponse> => {
    for (const check of opts.checks) {
      let ok = false;
      try {
        ok = await check();
      } catch {
        ok = false; // never surface the failure detail to the client
      }
      if (!ok) throw new ApiHttpError("unavailable");
    }
    return { status: "ok", version: APP_VERSION, contract: CONTRACT_VERSION, time: new Date().toISOString() };
  });
};
