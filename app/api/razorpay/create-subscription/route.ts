import { NextResponse } from "next/server";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: Request) {
  try {
    // Check if Razorpay credentials are configured
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json(
        { error: "Payment service not configured. Please contact support." },
        { status: 500 }
      );
    }

    const { userId, userEmail, userName, phone } = await req.json();

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "User ID and email are required" },
        { status: 400 }
      );
    }

    // Create Razorpay Plan (if not exists)
    const planData = {
      period: "monthly",
      interval: 1,
      item: {
        name: "Watzy Pro Plan",
        description: "Monthly subscription to Watzy Pro features",
        amount: 25900, // ₹259 in paise
        currency: "INR",
      },
      notes: {
        plan_type: "pro",
        features: "advanced_analytics,priority_support",
      },
    };

    // Create plan
    const planResponse = await fetch("https://api.razorpay.com/v1/plans", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body: JSON.stringify(planData),
    });

    let plan;
    if (planResponse.ok) {
      plan = await planResponse.json();
    } else {
      // If plan creation fails, try to use existing plan
      console.log("Plan creation failed, using default plan logic");
      plan = { id: "plan_default" }; // Fallback
    }

    // Create subscription
    const subscriptionData = {
      plan_id: plan.id,
      customer_notify: 1,
      quantity: 1,
      total_count: 120, // 10 years worth of payments
      addons: [],
      notes: {
        user_id: userId,
        subscription_type: "pro",
      },
      notify_info: {
        notify_email: userEmail,
        notify_phone: phone || "",
      },
    };

    const subscriptionResponse = await fetch(
      "https://api.razorpay.com/v1/subscriptions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    if (!subscriptionResponse.ok) {
      const errorData = await subscriptionResponse.text();
      console.error("Razorpay Subscription API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    const subscription = await subscriptionResponse.json();

    return NextResponse.json({
      subscriptionId: subscription.id,
      planId: plan.id,
      status: subscription.status,
      shortUrl: subscription.short_url,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
      chargeAt: subscription.charge_at,
      auth_attempts: subscription.auth_attempts,
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
