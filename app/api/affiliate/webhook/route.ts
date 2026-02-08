import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

/**
 * POST /api/affiliate/webhook
 * Handle payment webhooks from Stripe and Razorpay
 * Calculate and create commission records for referred users
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // Determine webhook source
    const webhookSource = req.headers.get("x-webhook-source") || "stripe";

    if (webhookSource === "stripe") {
      return handleStripeWebhook(body, signature);
    } else if (webhookSource === "razorpay") {
      return handleRazorpayWebhook(body);
    } else {
      return NextResponse.json(
        { error: "Unknown webhook source" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle Stripe webhook events
 */
async function handleStripeWebhook(body: string, signature: string | null) {
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle subscription created or updated
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "invoice.payment_succeeded"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Get customer email to find user
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return NextResponse.json({ received: true });
      }

      const customerEmail = customer.email;

      if (!customerEmail) {
        console.log("No customer email found");
        return NextResponse.json({ received: true });
      }

      // Calculate commission
      await processCommission({
        userEmail: customerEmail,
        amount: subscription.items.data[0]?.price?.unit_amount || 0,
        currency: subscription.currency,
        subscriptionId: subscription.id,
        provider: "stripe",
        status: subscription.status,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Stripe webhook failed" },
      { status: 400 }
    );
  }
}

/**
 * Handle Razorpay webhook events
 */
async function handleRazorpayWebhook(body: string) {
  try {
    const payload = JSON.parse(body);
    const event = payload.event;

    // Handle subscription activated or charged
    if (
      event === "subscription.activated" ||
      event === "subscription.charged" ||
      event === "payment.captured"
    ) {
      const subscription =
        payload.payload.subscription?.entity || payload.payload.payment?.entity;

      if (!subscription) {
        return NextResponse.json({ received: true });
      }

      // Get customer details from notes
      const customerEmail = subscription.notes?.email;

      if (!customerEmail) {
        console.log("No customer email found in Razorpay webhook");
        return NextResponse.json({ received: true });
      }

      // Calculate commission
      await processCommission({
        userEmail: customerEmail,
        amount: subscription.amount || 0,
        currency: subscription.currency || "INR",
        subscriptionId: subscription.id,
        provider: "razorpay",
        status: subscription.status,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json(
      { error: "Razorpay webhook failed" },
      { status: 400 }
    );
  }
}

/**
 * Process commission for a payment
 */
async function processCommission(params: {
  userEmail: string;
  amount: number;
  currency: string;
  subscriptionId: string;
  provider: "stripe" | "razorpay";
  status: string;
}) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", params.userEmail)
      .single();

    if (userError || !user) {
      console.log("User not found:", params.userEmail);
      return;
    }

    // Check if user was referred by an affiliate
    const { data: referral, error: referralError } = await supabase
      .from("affiliate_referrals")
      .select(
        `
        id,
        affiliate_id,
        affiliate_partners!inner(
          id,
          commission_rate,
          status
        )
      `
      )
      .eq("referred_user_id", user.id)
      .single();

    if (referralError || !referral) {
      console.log("No referral found for user:", user.id);
      return;
    }

    const partnerArray = referral.affiliate_partners as any;
    const partner = Array.isArray(partnerArray)
      ? partnerArray[0]
      : partnerArray;

    // Check if partner is still active
    if (partner.status !== "active") {
      console.log("Affiliate partner is not active:", partner.id);
      return;
    }

    // Convert amount to dollars (Stripe uses cents, Razorpay uses paise for INR)
    const amountInDollars =
      params.provider === "stripe" ? params.amount / 100 : params.amount / 100; // Razorpay also uses smallest unit

    // Calculate commission (20% by default)
    const commissionRate = partner.commission_rate;
    const commissionAmount = amountInDollars * commissionRate;

    // Check if commission already exists for this subscription
    const { data: existingCommission } = await supabase
      .from("affiliate_commissions")
      .select("id")
      .eq("subscription_id", params.subscriptionId)
      .single();

    if (existingCommission) {
      console.log(
        "Commission already exists for subscription:",
        params.subscriptionId
      );
      return;
    }

    // Create commission record
    const { data: commission, error: commissionError } = await supabase
      .from("affiliate_commissions")
      .insert({
        affiliate_id: partner.id,
        referral_id: referral.id,
        amount: commissionAmount,
        currency: params.currency.toUpperCase(),
        subscription_id: params.subscriptionId,
        payment_provider: params.provider,
        status: "pending",
        paid_at: null,
      })
      .select()
      .single();

    if (commissionError) {
      console.error("Error creating commission:", commissionError);
      return;
    }

    // Update affiliate partner's total earnings and pending balance
    const { error: updateError } = await supabase.rpc(
      "update_affiliate_earnings",
      {
        p_affiliate_id: partner.id,
        p_commission_amount: commissionAmount,
      }
    );

    if (updateError) {
      console.error("Error updating affiliate earnings:", updateError);
    }

    // Update referral conversion status
    const { error: referralUpdateError } = await supabase
      .from("affiliate_referrals")
      .update({
        converted: true,
        converted_at: new Date().toISOString(),
      })
      .eq("id", referral.id);

    if (referralUpdateError) {
      console.error("Error updating referral:", referralUpdateError);
    }

    // Update click conversion status if click_id exists
    const { error: clickUpdateError } = await supabase
      .from("affiliate_clicks")
      .update({
        converted: true,
      })
      .eq("referral_code", referral.affiliate_id)
      .eq("converted", false);

    if (clickUpdateError) {
      console.error("Error updating click:", clickUpdateError);
    }

    console.log(
      `✅ Commission created: $${commissionAmount.toFixed(2)} for affiliate ${
        partner.id
      }`
    );

    // TODO: Send WhatsApp notification to affiliate
    // TODO: Send email notification to affiliate
  } catch (error) {
    console.error("Error processing commission:", error);
  }
}
