import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@/lib/db";
import { getUser } from "@/lib/auth";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: Request) {
  try {
    const { orderId, paymentId, signature } = await req.json();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify signature
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Get current user
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create subscription
    const supabase = createServerClient(true); // Use service role

    // Get the monthly plan
    const { data: plans } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", "Monthly Pro")
      .limit(1);

    if (!plans || plans.length === 0) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 500 }
      );
    }

    const planId = plans[0].id;

    // Check for existing active subscription
    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("id, ends_at")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("ends_at", { ascending: false })
      .limit(1);

    let startDate = new Date();
    let endDate = new Date();

    if (existingSub && existingSub.length > 0) {
      // Extend existing subscription
      startDate = new Date(existingSub[0].ends_at);
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
    } else {
      // New subscription
      endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Add 30 days
    }

    // Create new subscription record
    const { error: subError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: "active",
        payment_id: paymentId,
        payment_provider: "razorpay",
        is_trial: false,
      });

    if (subError) {
      console.error("Subscription creation error:", subError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    // Process referral reward if user was referred
    const { data: rewardProcessed, error: rewardError } = await supabase.rpc(
      "process_referral_reward",
      {
        referred_user_uuid: user.id,
      }
    );

    if (rewardError) {
      console.error("Error processing referral reward:", rewardError);
      // Don't fail the payment verification, just log the error
    } else if (rewardProcessed) {
      console.log("✅ Referral reward granted for user:", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and subscription activated",
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
