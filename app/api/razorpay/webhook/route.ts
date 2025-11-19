import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";
import crypto from "crypto";

// Verify Razorpay webhook signature
function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not configured");
    return false;
  }
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // Verify webhook signature for security
    if (signature && !verifyWebhookSignature(bodyText, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const event = body.event;
    const supabase = createServerClient(true); // Use service role

    console.log("📥 Razorpay webhook event:", event);

    // Handle payment events (existing logic)
    if (
      event === "payment.captured" &&
      body.payload?.payment?.entity?.receipt
    ) {
      const orderId = body.payload.payment.entity.receipt;

      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", orderId)
        .single();

      if (order && order.status !== "paid") {
        await supabase
          .from("orders")
          .update({
            status: "paid",
          } as Database["public"]["Tables"]["orders"]["Update"])
          .eq("id", orderId);

        console.log("✅ Order marked as paid:", orderId);
      }
    }

    // Handle subscription events
    const subscriptionEntity = body.payload?.subscription?.entity;
    const paymentEntity = body.payload?.payment?.entity;

    if (subscriptionEntity) {
      const subscriptionId = subscriptionEntity.id;
      const userId = subscriptionEntity.notes?.user_id;

      switch (event) {
        case "subscription.authenticated":
          await handleSubscriptionAuthenticated(supabase, subscriptionId);
          break;

        case "subscription.activated":
          await handleSubscriptionActivated(
            supabase,
            subscriptionEntity,
            userId
          );
          break;

        case "subscription.charged":
          await handleSubscriptionCharged(
            supabase,
            subscriptionEntity,
            paymentEntity,
            userId
          );
          break;

        case "subscription.completed":
          await handleSubscriptionCompleted(supabase, subscriptionId);
          break;

        case "subscription.cancelled":
          await handleSubscriptionCancelled(supabase, subscriptionEntity);
          break;

        case "subscription.paused":
          await handleSubscriptionPaused(supabase, subscriptionId);
          break;

        case "subscription.resumed":
          await handleSubscriptionResumed(supabase, subscriptionId);
          break;

        case "subscription.pending":
          await handleSubscriptionPending(supabase, subscriptionId);
          break;

        case "subscription.halted":
          await handleSubscriptionHalted(supabase, subscriptionId);
          break;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ Webhook error:", e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}

// Subscription event handlers

async function handleSubscriptionAuthenticated(
  supabase: any,
  subscriptionId: string
) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "authenticated" })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription authenticated:", subscriptionId);
}

async function handleSubscriptionActivated(
  supabase: any,
  subscriptionEntity: any,
  userId: string
) {
  const subscriptionId = subscriptionEntity.id;
  const currentStart = subscriptionEntity.current_start;
  const currentEnd = subscriptionEntity.current_end;

  await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      starts_at: new Date(currentStart * 1000).toISOString(),
      ends_at: new Date(currentEnd * 1000).toISOString(),
    })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription activated:", subscriptionId);

  // Process referral reward if user was referred
  if (userId) {
    const { data: rewardProcessed, error: rewardError } = await supabase.rpc(
      "process_referral_reward",
      {
        referred_user_uuid: userId,
      }
    );

    if (rewardError) {
      console.error("Error processing referral reward:", rewardError);
    } else if (rewardProcessed) {
      console.log("✅ Referral reward granted for user:", userId);
    }
  }
}

async function handleSubscriptionCharged(
  supabase: any,
  subscriptionEntity: any,
  paymentEntity: any,
  userId: string
) {
  const subscriptionId = subscriptionEntity.id;
  const currentEnd = subscriptionEntity.current_end;

  // Update subscription end date (renewal)
  await supabase
    .from("user_subscriptions")
    .update({
      ends_at: new Date(currentEnd * 1000).toISOString(),
      status: "active",
    })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription charged:", subscriptionId);

  // Log the payment
  if (paymentEntity) {
    await supabase.from("payment_logs").insert({
      payment_id: paymentEntity.id,
      subscription_id: subscriptionId,
      amount: paymentEntity.amount,
      currency: paymentEntity.currency,
      status: paymentEntity.status,
      method: paymentEntity.method,
      created_at: new Date(paymentEntity.created_at * 1000).toISOString(),
    });
  }

  // Process referral reward on first payment if applicable
  if (userId && subscriptionEntity.paid_count === 1) {
    await supabase.rpc("process_referral_reward", {
      referred_user_uuid: userId,
    });
  }
}

async function handleSubscriptionCompleted(
  supabase: any,
  subscriptionId: string
) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "completed" })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription completed:", subscriptionId);
}

async function handleSubscriptionCancelled(
  supabase: any,
  subscriptionEntity: any
) {
  const subscriptionId = subscriptionEntity.id;
  const endedAt = subscriptionEntity.ended_at;

  await supabase
    .from("user_subscriptions")
    .update({
      status: "cancelled",
      ends_at: endedAt ? new Date(endedAt * 1000).toISOString() : null,
    })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription cancelled:", subscriptionId);
}

async function handleSubscriptionPaused(supabase: any, subscriptionId: string) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "paused" })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription paused:", subscriptionId);
}

async function handleSubscriptionResumed(
  supabase: any,
  subscriptionId: string
) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "active" })
    .eq("payment_id", subscriptionId);

  console.log("✅ Subscription resumed:", subscriptionId);
}

async function handleSubscriptionPending(
  supabase: any,
  subscriptionId: string
) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "pending" })
    .eq("payment_id", subscriptionId);

  console.log("⏳ Subscription pending:", subscriptionId);
}

async function handleSubscriptionHalted(supabase: any, subscriptionId: string) {
  await supabase
    .from("user_subscriptions")
    .update({ status: "halted" })
    .eq("payment_id", subscriptionId);

  console.log("⚠️ Subscription halted:", subscriptionId);
}
