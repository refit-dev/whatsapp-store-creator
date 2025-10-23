import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db";
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
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = orderSchema.parse(body);
    
    const supabase = createServerClient();

    // Get store details
    const { data: store } = await supabase
      .from('stores')
      .select('id, currency')
      .eq('handle', order.storeHandle)
      .single();

    if (!store) {
      return new NextResponse('Store not found', { status: 404 });
    }

    // Calculate totals
    const subtotalCents = order.items.reduce((sum, item) => 
      sum + (item.priceCents * item.qty), 0);

    // Create order
    const { data: newOrder, error } = await supabase
      .from('orders')
      .insert({
        store_id: store.id,
        buyer_name: order.buyer.name,
        buyer_phone: order.buyer.phone,
        buyer_address: order.buyer.address,
        items: order.items,
        subtotal_cents: subtotalCents,
        total_cents: subtotalCents, // Add tax/shipping later
        status: 'created'
      } as Database['public']['Tables']['orders']['Insert'])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(newOrder);
  } catch (e) {
    console.error(e);
    return new NextResponse('Bad Request', { status: 400 });
  }
}