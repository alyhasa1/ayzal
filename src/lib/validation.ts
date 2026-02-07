import { z } from "zod";

export const contactSchema = z.object({
  contact_email: z.string().email("Valid email is required"),
  contact_phone: z.string().min(6, "Phone is required"),
});

export const shippingAddressSchema = z.object({
  line1: z.string().min(3, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().min(2, "Country is required"),
});

export const promoCodeSchema = z.object({
  code: z.string().trim().min(2, "Enter a valid promo code"),
});
