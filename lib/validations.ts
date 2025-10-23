import { z } from 'zod';

// Store settings schema
export const storeSchema = z.object({
  name: z.string().min(2).max(50),
  handle: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  whatsapp_e164: z.string().regex(/^\+?[1-9]\d{10,14}$/),
  currency: z.string().length(3),
  is_payments_enabled: z.boolean(),
  payment_provider: z.enum(['none', 'stripe', 'razorpay']),
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
  items: z.array(z.object({
    productId: z.string().uuid(),
    title: z.string(),
    priceCents: z.number().int().positive(),
    qty: z.number().int().positive(),
  })),
});