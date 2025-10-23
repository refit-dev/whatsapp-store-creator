import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";
import Stripe from "stripe";
import Razorpay from "razorpay";

// Initialize payment providers only if credentials are available
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-08-16" })
  : null;

const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;

const requestSchema = z.object({
  storeHandle: z.string(),
  orderId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payment = requestSchema.parse(body);

    const supabase = createServerClient();

    // Get store
    const { data: store } = await supabase
      .from("stores")
      .select("id, payment_provider")
      .eq("handle", payment.storeHandle)
      .single();

    if (!store) {
      return new NextResponse("Store not found", { status: 404 });
    }

    if (!store.payment_provider || store.payment_provider === "none") {
      return new NextResponse("Payments not enabled", { status: 400 });
    }

    // Get order
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", payment.orderId)
      .single();

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.payment_link_url) {
      return NextResponse.json({ payment_link_url: order.payment_link_url });
    }

    let paymentUrl = "";

    if (store.payment_provider === "stripe") {
      if (!stripe) {
        return new NextResponse("Stripe not configured", { status: 500 });
      }
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${process.env.APP_URL}/thanks?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/cancel`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: order.total_cents,
              product_data: {
                name: `Order #${order.id}`,
                description: order.items
                  .map((item: any) => `${item.title} x${item.qty}`)
                  .join(", "),
              },
            },
          },
        ],
        metadata: {
          order_id: order.id,
          store_id: store.id,
        },
      });
      paymentUrl = session.url!;
    } else if (store.payment_provider === "razorpay") {
      if (!razorpay) {
        return new NextResponse("Razorpay not configured", { status: 500 });
      }
      const rzpOrder = await razorpay.orders.create({
        amount: order.total_cents,
        currency: "INR",
        receipt: order.id,
        notes: {
          store_id: store.id,
        },
      });
      paymentUrl = `${process.env.APP_URL}/pay/razorpay/${rzpOrder.id}`;
    }

    if (!paymentUrl) {
      return new NextResponse("Payment URL generation failed", { status: 500 });
    }

    // Update order with payment link
    await supabase
      .from("orders")
      .update({
        payment_link_url: paymentUrl,
      } as Database["public"]["Tables"]["orders"]["Update"])
      .eq("id", payment.orderId);

    return NextResponse.json({ payment_link_url: paymentUrl });
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
