import { describe, expect, it } from "vitest";
import { ConfigError, DEFAULT_DATABASE_PATH, DEFAULT_WEB_ORIGIN, loadConfig } from "./config";

const fails = (env: Record<string, string>): string => {
  try {
    loadConfig(env);
  } catch (e) {
    expect(e).toBeInstanceOf(ConfigError);
    return (e as ConfigError).message;
  }
  throw new Error("expected loadConfig to throw");
};

describe("loadConfig", () => {
  it("has safe defaults: loopback bind, port 3001, contract WEB_ORIGIN, proxy trust off", () => {
    expect(loadConfig({})).toEqual({
      env: "development",
      host: "127.0.0.1",
      port: 3001,
      webOrigins: DEFAULT_WEB_ORIGIN.split(","),
      trustProxy: false,
      logLevel: "info",
      databasePath: DEFAULT_DATABASE_PATH,
    });
    expect(DEFAULT_WEB_ORIGIN).toBe("http://localhost:5173,http://127.0.0.1:5173");
    expect(DEFAULT_DATABASE_PATH).toBe("data/site.db");
  });

  it("is silent by default when NODE_ENV=test", () => {
    expect(loadConfig({ NODE_ENV: "test" }).logLevel).toBe("silent");
    expect(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "debug" }).logLevel).toBe("debug");
  });

  it("reads and trims every variable; empty strings count as unset", () => {
    const c = loadConfig({
      NODE_ENV: "production",
      HOST: " 127.0.0.1 ",
      PORT: "8080",
      WEB_ORIGIN: "https://a.example, http://localhost:3000 ,,",
      TRUST_PROXY: "true",
      LOG_LEVEL: "warn",
      DATABASE_PATH: " data/custom.db ",
    });
    expect(c).toEqual({
      env: "production",
      host: "127.0.0.1",
      port: 8080,
      webOrigins: ["https://a.example", "http://localhost:3000"],
      trustProxy: true,
      logLevel: "warn",
      databasePath: "data/custom.db",
    });
    expect(loadConfig({ PORT: "", HOST: "  ", WEB_ORIGIN: "", DATABASE_PATH: "" }).port).toBe(3001);
    expect(loadConfig({ DATABASE_PATH: "" }).databasePath).toBe(DEFAULT_DATABASE_PATH);
    expect(loadConfig({ DATABASE_PATH: ":memory:" }).databasePath).toBe(":memory:");
  });

  it("rejects a NUL byte in DATABASE_PATH", () => {
    expect(fails({ DATABASE_PATH: "data/site.db\u0000.evil" })).toContain("DATABASE_PATH");
  });

  it.each(["0", "65536", "-1", "abc", "3001.5", "1e3", "0x50", "99999999", " "])("rejects PORT=%j", (PORT) => {
    if (PORT.trim() === "") return; // blank is "unset", covered above
    expect(fails({ PORT })).toContain("PORT");
  });

  it.each(["*", "http://localhost:5173/", "http://localhost:5173/app", "localhost:5173", "ftp://x.example", "javascript:alert(1)", "http://a.example,*", "null"])(
    "rejects WEB_ORIGIN=%j",
    (WEB_ORIGIN) => {
      expect(fails({ WEB_ORIGIN })).toContain("WEB_ORIGIN");
    },
  );

  it("rejects bad enums and booleans", () => {
    expect(fails({ NODE_ENV: "staging" })).toContain("NODE_ENV");
    expect(fails({ TRUST_PROXY: "yes" })).toContain("TRUST_PROXY");
    expect(fails({ TRUST_PROXY: "1" })).toContain("TRUST_PROXY");
    expect(fails({ LOG_LEVEL: "verbose" })).toContain("LOG_LEVEL");
  });

  it("reports every problem, never the offending values", () => {
    const secret = "S3CRET-VALUE-123";
    const msg = fails({ NODE_ENV: secret, PORT: secret, WEB_ORIGIN: secret, TRUST_PROXY: secret, LOG_LEVEL: secret });
    expect(msg).not.toContain(secret);
    for (const name of ["NODE_ENV", "PORT", "WEB_ORIGIN", "TRUST_PROXY", "LOG_LEVEL"]) expect(msg).toContain(name);
  });

  it("ignores unrelated variables", () => {
    expect(() => loadConfig({ PATH: "/usr/bin", OPERATOR_PASSWORD_HASH: "x" })).not.toThrow();
  });
});
