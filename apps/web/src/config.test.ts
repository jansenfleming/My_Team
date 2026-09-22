// @vitest-environment node
// Node environment: the Vite config pulls in esbuild, which does not run under jsdom.
import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("vite config (ADR 0003 conventions: static site, no API)", () => {
  it("binds the dev and preview servers to loopback and fails rather than picking another port", () => {
    expect(config.server?.host).toBe("127.0.0.1");
    expect(config.server?.port).toBe(5173);
    expect(config.server?.strictPort).toBe(true);
    expect(config.preview?.host).toBe("127.0.0.1");
    expect(config.preview?.strictPort).toBe(true);
  });

  it("has no API proxy (there is no backend in this project)", () => {
    expect(config.server?.proxy).toBeUndefined();
    expect(config.preview?.proxy).toBeUndefined();
  });
});
