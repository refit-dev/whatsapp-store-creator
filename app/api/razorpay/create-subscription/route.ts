import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import {
  createRazorpaySubscription,
  calculateDiscountedAmount,
} from "@/lib/razorpay-subscriptions";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan_id, offer_code } = body;

    if (!plan_id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!plan.razorpay_plan_id) {
      return NextResponse.json(
        {
          error:
            "This plan is not configured for subscriptions. Please contact support.",
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    let offerId: string | null = null;
    let finalAmount = plan.price_cents || 0;

    // Apply offer if provided
    if (offer_code) {
      const { data: offer, error: offerError } = await supabase
        .from("special_offers")
        .select("*")
        .eq("code", offer_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (offer && !offerError) {
        // Check if offer is still valid
        const now = new Date();
        const validFrom = offer.starts_at ? new Date(offer.starts_at) : null;
        const validUntil = offer.ends_at ? new Date(offer.ends_at) : null;

        if (validFrom && now < validFrom) {
          return NextResponse.json(
            { error: "This offer is not yet active" },
            { status: 400 }
          );
        }

        if (validUntil && now > validUntil) {
          return NextResponse.json(
            { error: "This offer has expired" },
            { status: 400 }
          );
        }

        // Check usage limit
        if (offer.max_uses && offer.usage_limit_type === "limited") {
          const { count } = await supabase
            .from("offer_redemptions")
            .select("*", { count: "exact", head: true })
            .eq("offer_id", offer.id);

          if (count && count >= offer.max_uses) {
            return NextResponse.json(
              { error: "This offer has reached its usage limit" },
              { status: 400 }
            );
          }
        }

        // Check if user already used this offer
        if (offer.max_uses_per_user) {
          const { count } = await supabase
            .from("offer_redemptions")
            .select("*", { count: "exact", head: true })
            .eq("offer_id", offer.id)
            .eq("user_id", user.id);

          if (count && count >= offer.max_uses_per_user) {
            return NextResponse.json(
              { error: "You have already used this offer" },
              { status: 400 }
            );
          }
        }

        // Calculate discount
        if (offer.offer_type === "percentage_discount") {
          const percentageOff = offer.percentage_off || 0;
          finalAmount = calculateDiscountedAmount(
            plan.price_cents || 0,
            "percentage",
            percentageOff
          );
          discountAmount = (plan.price_cents || 0) - finalAmount;
          offerId = offer.id;
        } else if (offer.offer_type === "fixed_amount") {
          const amountOff = offer.fixed_amount_off || 0;
          finalAmount = calculateDiscountedAmount(
            plan.price_cents || 0,
            "fixed_amount",
            amountOff
          );
          discountAmount = (plan.price_cents || 0) - finalAmount;
          offerId = offer.id;
        } else if (offer.offer_type === "extended_trial") {
          // For trial extension, we'll handle it differently (add days to trial)
          offerId = offer.id;
        }
      } else {
        return NextResponse.json(
          { error: "Invalid or inactive offer code" },
          { status: 400 }
        );
      }
    }

    // Get user email for notifications
    const userEmail = user.email;

    // Prepare subscription notes
    const notes: Record<string, string> = {
      user_id: user.id,
      plan_id: plan_id,
      original_amount: (plan.price_cents || 0).toString(),
    };

    if (offerId) {
      notes.offer_id = offerId;
      notes.discount_amount = discountAmount.toString();
      notes.final_amount = finalAmount.toString();
    }

    // Create subscription in Razorpay
    const subscription = await createRazorpaySubscription({
      plan_id: plan.razorpay_plan_id,
      customer_notify: 1,
      quantity: 1,
      notes,
      notify_info: userEmail
        ? {
            notify_email: userEmail,
          }
        : undefined,
      offer_id: offerId || undefined,
    });

    // Calculate dates
    const now = new Date();
    const startDate = subscription.start_at
      ? new Date(subscription.start_at * 1000)
      : now;
    const endDate = subscription.current_end
      ? new Date(subscription.current_end * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Create pending subscription record in database
    const { data: dbSubscription, error: dbError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan_id,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString(),
        status: "pending",
        payment_provider: "razorpay",
        payment_id: subscription.id,
        is_trial: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create subscription record" },
        { status: 500 }
      );
    }

    // Record offer redemption if offer was applied
    if (offerId) {
      await supabase.from("offer_redemptions").insert({
        offer_id: offerId,
        user_id: user.id,
        subscription_id: dbSubscription.id,
        discount_amount: discountAmount,
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        short_url: subscription.short_url,
        status: subscription.status,
        amount: finalAmount,
        original_amount: plan.price_cents,
        discount_amount: discountAmount,
      },
      db_subscription: dbSubscription,
    });
  } catch (error: any) {
    console.error("Subscription creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
