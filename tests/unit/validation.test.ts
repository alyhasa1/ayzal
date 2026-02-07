import { describe, expect, it } from "vitest";
import {
  contactSchema,
  promoCodeSchema,
  shippingAddressSchema,
} from "../../src/lib/validation";

describe("checkout validation schemas", () => {
  it("contactSchema accepts valid payload", () => {
    const parsed = contactSchema.safeParse({
      contact_email: "shopper@example.com",
      contact_phone: "03001234567",
    });
    expect(parsed.success).toBe(true);
  });

  it("contactSchema rejects invalid email", () => {
    const parsed = contactSchema.safeParse({
      contact_email: "not-an-email",
      contact_phone: "03001234567",
    });
    expect(parsed.success).toBe(false);
  });

  it("shippingAddressSchema requires line1/city/country", () => {
    const parsed = shippingAddressSchema.safeParse({
      line1: "Street 123",
      city: "Lahore",
      country: "Pakistan",
    });
    expect(parsed.success).toBe(true);
  });

  it("promoCodeSchema trims and validates minimum length", () => {
    const parsed = promoCodeSchema.safeParse({ code: "  EID25  " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("EID25");
    }
  });
});
