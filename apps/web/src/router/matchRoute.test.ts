import { describe, expect, it } from "vitest";
import { matchRoute } from "./matchRoute";

describe("matchRoute", () => {
  it("matches the home route", () => {
    expect(matchRoute("/")).toEqual({ name: "home" });
  });

  it("matches the catalog route", () => {
    expect(matchRoute("/catalog")).toEqual({ name: "catalog" });
  });

  it("matches the lookbook route", () => {
    expect(matchRoute("/lookbook")).toEqual({ name: "lookbook" });
  });

  it("matches the about route", () => {
    expect(matchRoute("/about")).toEqual({ name: "about" });
  });

  it("matches a product detail route and captures the slug", () => {
    expect(matchRoute("/product/circuit-hoodie")).toEqual({
      name: "product",
      slug: "circuit-hoodie",
    });
  });

  it("decodes an encoded slug", () => {
    expect(matchRoute("/product/sudo%20tee")).toEqual({
      name: "product",
      slug: "sudo tee",
    });
  });

  it("falls back to not-found for an unknown path", () => {
    expect(matchRoute("/nope")).toEqual({ name: "not-found" });
  });

  it("falls back to not-found for a product route with no slug", () => {
    expect(matchRoute("/product/")).toEqual({ name: "not-found" });
  });

  it("treats a trailing slash the same as no trailing slash", () => {
    expect(matchRoute("/catalog/")).toEqual({ name: "catalog" });
  });

  it("treats the bare root as home regardless of an empty string", () => {
    expect(matchRoute("")).toEqual({ name: "home" });
  });
});
