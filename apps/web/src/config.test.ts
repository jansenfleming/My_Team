// @vitest-environment node
// Node environment: the Vite config pulls in esbuild, which does not run under jsdom.
import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("vite config (ADR 0001 conventions)", () => {
  it("binds the dev server to loopback on 5173 and fails rather than picking another port", () => {
    expect(config.server?.host).toBe("127.0.0.1");
    expect(config.server?.port).toBe(5173);
    expect(config.server?.strictPort).toBe(true);
  });

  it("proxies /api to the API on 127.0.0.1:3001 in dev and preview", () => {
    const expected = { "/api": { target: "http://127.0.0.1:3001", changeOrigin: false } };
    expect(config.server?.proxy).toEqual(expected);
    expect(config.preview?.proxy).toEqual(expected);
  });
});
