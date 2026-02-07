import { describe, expect, it } from "vitest";
import {
  parseRedirectRules,
  resolveRedirect,
  shouldSkipRedirect,
} from "../../src/lib/redirects";

describe("redirect helpers", () => {
  it("parses and sanitizes valid redirect rules", () => {
    const rules = parseRedirectRules([
      { from: " /old-page/ ", to: "/new-page", status: 301 },
      { from: "/old-page", to: "/new-page", status: 301 },
      { from: "/ignore", to: "/ignore", status: 301 },
    ]);

    expect(rules).toEqual([{ from: "/old-page", to: "/new-page", status: 301 }]);
  });

  it("resolves matching path and ignores self redirects", () => {
    const rules = parseRedirectRules([
      { from: "/a", to: "/b", status: 301 },
      { from: "/loop", to: "/loop", status: 301 },
    ]);
    expect(resolveRedirect("/a/", rules)).toEqual({
      from: "/a",
      to: "/b",
      status: 301,
    });
    expect(resolveRedirect("/loop", rules)).toBeNull();
  });

  it("skips static and asset routes", () => {
    expect(shouldSkipRedirect("/build/app.js")).toBe(true);
    expect(shouldSkipRedirect("/favicon.ico")).toBe(true);
    expect(shouldSkipRedirect("/sitemap.xml")).toBe(true);
    expect(shouldSkipRedirect("/category/formals")).toBe(false);
  });
});
