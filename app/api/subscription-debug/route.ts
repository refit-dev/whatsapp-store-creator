import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Debug endpoint to check subscription configuration
 * GET /api/subscription-debug
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      auth: {
        authenticated: !!user,
        userId: user?.id || null,
        error: authError?.message || null,
      },
      razorpay: {
        keyIdConfigured: !!process.env.RAZORPAY_KEY_ID,
        keySecretConfigured: !!process.env.RAZORPAY_KEY_SECRET,
        webhookSecretConfigured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
        publicKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
          ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.substring(0, 15) + "..."
          : null,
      },
      subscriptionPlans: [],
      userSubscriptions: [],
      errors: [],
    };

    // Check subscription plans
    try {
      const { data: plans, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_cents", { ascending: true, nullsFirst: false });

      if (plansError) {
        diagnostics.errors.push({
          type: "subscription_plans",
          message: plansError.message,
        });
      } else {
        diagnostics.subscriptionPlans = plans?.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price_cents ? plan.price_cents / 100 : 0,
          currency: plan.currency || "INR",
          intervalType: plan.interval_type,
          durationDays: plan.duration_days,
          isTrial: plan.is_trial,
          hasRazorpayPlanId: !!plan.razorpay_plan_id,
          razorpayPlanId: plan.razorpay_plan_id || "NOT_SET",
        }));

        // Check for missing Razorpay plan IDs
        const missingPlanIds = plans?.filter(
          (p) => !p.is_trial && !p.razorpay_plan_id
        );
        if (missingPlanIds && missingPlanIds.length > 0) {
          diagnostics.errors.push({
            type: "missing_razorpay_plan_ids",
            message: `${missingPlanIds.length} plan(s) missing Razorpay Plan IDs`,
            plans: missingPlanIds.map((p) => p.name),
          });
        }
      }
    } catch (error: any) {
      diagnostics.errors.push({
        type: "subscription_plans_exception",
        message: error.message,
      });
    }

    // Check user subscriptions if authenticated
    if (user) {
      try {
        const { data: subs, error: subsError } = await supabase
          .from("user_subscriptions")
          .select("id, plan_id, status, starts_at, ends_at, payment_id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (subsError) {
          diagnostics.errors.push({
            type: "user_subscriptions",
            message: subsError.message,
          });
        } else {
          diagnostics.userSubscriptions = subs || [];
        }
      } catch (error: any) {
        diagnostics.errors.push({
          type: "user_subscriptions_exception",
          message: error.message,
        });
      }
    }

    // Check for existing active subscription
    if (user) {
      const { data: activeSub } = await supabase
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      diagnostics.hasActiveSubscription = !!activeSub;
    }

    return NextResponse.json({
      success: true,
      diagnostics,
    });
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
