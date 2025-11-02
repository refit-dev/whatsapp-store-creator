import { z } from "zod";

// Store settings schema
export const storeSchema = z.object({
  name: z.string().min(2).max(50),
  handle: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/),
  whatsapp_e164: z.string().regex(/^\+?[1-9]\d{10,14}$/),
  currency: z.string().length(3),
  is_payments_enabled: z.boolean(),
  payment_provider: z.enum(["none", "stripe", "razorpay"]),
  logo_url: z.string().url().nullable(),
  banner_url: z.string().url().nullable(),
});

// Product schema
export const productSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  price_cents: z.number().int().positive(),
  currency: z.string().length(3),
  image_urls: z.array(z.string().url()),
  variants: z.record(z.string(), z.array(z.string())).nullable(),
  is_active: z.boolean(),
  stock_qty: z.number().int().min(0).nullable(),
});

// Order schema
export const orderSchema = z.object({
  storeHandle: z.string(),
  buyer: z.object({
    name: z.string().min(1),
    phone: z.string().min(10),
    address: z.string().min(1),
    notes: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      title: z.string(),
      priceCents: z.number().int().positive(),
      qty: z.number().int().positive(),
    })
  ),
});

// Phone validation helpers
// Accepts:
// - India: +91XXXXXXXXXX or local 10-digit starting 6-9
// - International: E.164 with leading + and 10-15 digits total
const RE_PHONE = /^(?:\+91[6-9]\d{9}|[6-9]\d{9}|\+[1-9]\d{9,14})$/;

export function isValidPhoneInternational(input: string): boolean {
  if (!input) return false;
  const phone = String(input).trim().replace(/\s+/g, "");
  return RE_PHONE.test(phone);
}
