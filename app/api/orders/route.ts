import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db";
import { checkStockAvailability, reduceInventory } from "@/lib/inventory";
import type { Database } from "@/types/supabase";

const orderSchema = z.object({
  storeHandle: z.string(),
  buyer: z.object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      title: z.string(),
      priceCents: z.number(),
      qty: z.number(),
    })
  ),
  paymentMethod: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = orderSchema.parse(body);

    // Try to use service role if available, fallback to regular client
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createServerClient(hasServiceRole);

    // Get store details (maybeSingle avoids error when 0 rows returned)
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, currency")
      .eq("handle", order.storeHandle)
      .maybeSingle();

    if (storeError) {
      console.error("Store lookup error:", storeError);
      return new NextResponse("Store lookup failed", { status: 500 });
    }

    if (!store) {
      return new NextResponse("Store not found", { status: 404 });
    }

    // Check stock availability before creating order
    const stockCheck = await checkStockAvailability(order.items);
    if (!stockCheck.success) {
      return NextResponse.json({ error: stockCheck.message }, { status: 400 });
    }

    // Calculate totals
    const subtotalCents = order.items.reduce(
      (sum, item) => sum + item.priceCents * item.qty,
      0
    );

    // Create order
    const { data: newOrder, error } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        buyer_name: order.buyer.name,
        buyer_phone: order.buyer.phone,
        buyer_address: order.buyer.address,
        items: order.items,
        subtotal_cents: subtotalCents,
        total_cents: subtotalCents, // Add tax/shipping later
        status: "created",
      } as Database["public"]["Tables"]["orders"]["Insert"])
      .select()
      .single();

    if (error) throw error;

    // Reduce inventory immediately for ALL orders
    // Both WhatsApp and Online payment orders reduce stock when order is placed
    // (Online payments go directly to seller, buyer shares screenshot)
    console.log(
      `📦 Reducing inventory for ${order.paymentMethod || "direct"} order:`,
      newOrder.id
    );
    const inventoryResult = await reduceInventory(order.items);
    if (!inventoryResult.success) {
      console.error("⚠️ Inventory reduction failed:", inventoryResult.message);
      // Don't fail the order, just log the error
    }

    return NextResponse.json(newOrder);
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
