import { NextResponse } from "next/server";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

export async function POST(req: Request) {
  try {
    const { subscriptionId, action } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    let url = `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`;
    let method = "GET";
    let body = null;

    // Handle different actions
    if (action === "cancel") {
      url += "/cancel";
      method = "POST";
      body = JSON.stringify({
        cancel_at_cycle_end: 0, // Cancel immediately
      });
    } else if (action === "pause") {
      url += "/pause";
      method = "POST";
      body = JSON.stringify({
        pause_at: "now",
      });
    } else if (action === "resume") {
      url += "/resume";
      method = "POST";
      body = JSON.stringify({
        resume_at: "now",
      });
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
        ).toString("base64")}`,
      },
      body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Razorpay Subscription Management error:", errorData);
      return NextResponse.json(
        { error: "Failed to manage subscription" },
        { status: 500 }
      );
    }

    const subscription = await response.json();

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
      chargeAt: subscription.charge_at,
      paidCount: subscription.paid_count,
      remainingCount: subscription.remaining_count,
    });
  } catch (error) {
    console.error("Manage subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get("id");

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.razorpay.com/v1/subscriptions/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Razorpay Get Subscription error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    const subscription = await response.json();

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentStart: subscription.current_start,
      currentEnd: subscription.current_end,
      chargeAt: subscription.charge_at,
      paidCount: subscription.paid_count,
      remainingCount: subscription.remaining_count,
      planId: subscription.plan_id,
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
