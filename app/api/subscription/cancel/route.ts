import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const { subscriptionId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, cancel the subscription with Razorpay
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          cancel_at_cycle_end: 0, // Cancel immediately
        }),
      }
    );

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.text();
      console.error("Razorpay cancellation error:", errorData);
      return NextResponse.json(
        { error: "Failed to cancel subscription with payment provider" },
        { status: 500 }
      );
    }

    const razorpayResult = await razorpayResponse.json();

    // Update the subscription status in our database
    const { data: subscription, error: dbError } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("razorpay_subscription_id", subscriptionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        { error: "Failed to update subscription status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: razorpayResult.id,
      status: razorpayResult.status,
      message:
        "Subscription cancelled successfully. You can continue using Pro features until the end of your current billing period.",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
