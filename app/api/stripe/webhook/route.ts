import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed");
      return new NextResponse("Bad Request", { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        console.error("No order ID in session metadata");
        return new NextResponse("Bad Request", { status: 400 });
      }

      const supabase = createServerClient(true); // Use service role

      // Get order details before updating
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (order && order.status !== "paid") {
        // Update order status
        // Note: Inventory is already reduced when order is created
        await supabase
          .from("orders")
          .update({
            status: "paid",
          } as Database["public"]["Tables"]["orders"]["Update"])
          .eq("id", orderId);

        console.log("✅ Order marked as paid:", orderId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
