import { describe, expect, it } from "vitest";
import { formatOrderNumber, formatPrice } from "../../src/lib/format";

describe("format helpers", () => {
  it("formatPrice uses PK locale with Rs prefix", () => {
    expect(formatPrice(18500)).toBe("Rs. 18,500");
  });

  it("formatOrderNumber prefers explicit order_number", () => {
    const result = formatOrderNumber({
      _id: "abc123xyz999",
      order_number: "AYZ-12345",
      created_at: Date.UTC(2026, 0, 1),
    });
    expect(result).toBe("AYZ-12345");
  });

  it("formatOrderNumber generates deterministic fallback value", () => {
    const result = formatOrderNumber({
      _id: "abcdef123456",
      created_at: Date.UTC(2026, 0, 2),
    });
    expect(result).toBe("AYZ-260102-123456");
  });
});
