import { describe, expect, it } from "vitest";
import {
  buildRateLimitHeaders,
  checkRateLimit,
  resolveRequestIp,
} from "../../src/lib/rate-limit.server";

describe("rate-limit utility", () => {
  it("blocks when limit is exceeded in the same window", () => {
    const now = 1_700_000_000_000;
    const first = checkRateLimit({
      namespace: "test",
      key: "ip-1",
      max: 2,
      windowMs: 60_000,
      now,
    });
    const second = checkRateLimit({
      namespace: "test",
      key: "ip-1",
      max: 2,
      windowMs: 60_000,
      now: now + 1_000,
    });
    const third = checkRateLimit({
      namespace: "test",
      key: "ip-1",
      max: 2,
      windowMs: 60_000,
      now: now + 2_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets counts when the time window expires", () => {
    const now = 1_700_000_100_000;
    const blocked = checkRateLimit({
      namespace: "test-reset",
      key: "ip-2",
      max: 1,
      windowMs: 5_000,
      now,
    });
    const blockedAgain = checkRateLimit({
      namespace: "test-reset",
      key: "ip-2",
      max: 1,
      windowMs: 5_000,
      now: now + 1_000,
    });
    const afterReset = checkRateLimit({
      namespace: "test-reset",
      key: "ip-2",
      max: 1,
      windowMs: 5_000,
      now: now + 6_000,
    });

    expect(blocked.allowed).toBe(true);
    expect(blockedAgain.allowed).toBe(false);
    expect(afterReset.allowed).toBe(true);
  });

  it("builds standard rate-limit headers", () => {
    const result = checkRateLimit({
      namespace: "test-headers",
      key: "ip-3",
      max: 1,
      windowMs: 60_000,
      now: 1_700_000_200_000,
    });
    const blocked = checkRateLimit({
      namespace: "test-headers",
      key: "ip-3",
      max: 1,
      windowMs: 60_000,
      now: 1_700_000_201_000,
    });
    const headers = buildRateLimitHeaders(blocked);

    expect(result.allowed).toBe(true);
    expect(headers.get("X-RateLimit-Limit")).toBe("1");
    expect(headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(headers.get("Retry-After")).toBeTruthy();
  });

  it("resolves client ip from common forwarding headers", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.1, 10.0.0.1",
      },
    });
    expect(resolveRequestIp(request)).toBe("203.0.113.1");
  });
});
