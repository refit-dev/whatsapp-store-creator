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
    console.log("🔵 Subscription creation started");
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
      console.error("❌ Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", user.id);

    const body = await request.json();
    const { plan_id, offer_code } = body;
    console.log("📦 Request body:", { plan_id, offer_code });

    if (!plan_id) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      );
    }

    // Get plan details from database
    console.log("🔍 Fetching plan from database...");
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      console.error("❌ Plan fetch error:", planError);
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    console.log("📋 Plan details:", {
      id: plan.id,
      name: plan.name,
      price_cents: plan.price_cents,
      razorpay_plan_id: plan.razorpay_plan_id,
    });

    if (!plan.razorpay_plan_id) {
      console.error("❌ Missing razorpay_plan_id for plan:", plan.id);
      return NextResponse.json(
        {
          error:
            "This plan is not configured for subscriptions. Please contact support.",
          debug: {
            plan_id: plan.id,
            plan_name: plan.name,
          },
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    console.log("🔍 Checking for existing active subscription...");
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      console.log(
        "⚠️ User already has active subscription:",
        existingSubscription.id
      );
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    console.log("✅ No active subscription found");

    let discountAmount = 0;
    let offerId: string | null = null;
    let finalAmount = plan.price_cents || 0;
    let appliedOfferRecord: any = null;

    // Apply offer if provided OR pick the user's pre-applied redemption
    const now = new Date();
    let preAppliedRedemptionId: string | null = null;

    if (offer_code) {
      const { data: offer, error: offerError } = await supabase
        .from("special_offers")
        .select("*")
        .eq("code", offer_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (!offer || offerError) {
        return NextResponse.json(
          { error: "Invalid or inactive offer code" },
          { status: 400 }
        );
      }
      appliedOfferRecord = offer;
    } else {
      // Look for a pre-applied redemption for this user (status applied, no subscription yet, active offer)
      const { data: redemption } = await supabase
        .from("offer_redemptions")
        .select(
          `
          *,
          offer:special_offers(*)
        `
        )
        .eq("user_id", user.id)
        .is("subscription_id", null)
        .eq("status", "applied")
        .order("applied_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (redemption && redemption.offer) {
        const offer = (redemption as any).offer;
        const validFrom = offer.starts_at ? new Date(offer.starts_at) : null;
        const validUntil = offer.ends_at ? new Date(offer.ends_at) : null;
        const withinWindow =
          (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);

        const targetedOk =
          offer.applicable_to?.includes("all") ||
          !offer.target_user_ids ||
          offer.target_user_ids.length === 0 ||
          offer.target_user_ids.includes(user.id);

        if (offer.is_active && withinWindow && targetedOk) {
          appliedOfferRecord = offer;
          offerId = offer.id;
          preAppliedRedemptionId = (redemption as any).id || null;
        }
      }
    }

    // Calculate discount if an offer is available
    if (appliedOfferRecord) {
      if (appliedOfferRecord.offer_type === "percentage_discount") {
        const percentageOff = appliedOfferRecord.percentage_off || 0;
        finalAmount = calculateDiscountedAmount(
          plan.price_cents || 0,
          "percentage",
          percentageOff
        );
        discountAmount = (plan.price_cents || 0) - finalAmount;
        offerId = appliedOfferRecord.id;
      } else if (appliedOfferRecord.offer_type === "fixed_amount") {
        const amountOff = appliedOfferRecord.fixed_amount_off || 0;
        finalAmount = calculateDiscountedAmount(
          plan.price_cents || 0,
          "fixed_amount",
          amountOff
        );
        discountAmount = (plan.price_cents || 0) - finalAmount;
        offerId = appliedOfferRecord.id;
      } else if (appliedOfferRecord.offer_type === "extended_trial") {
        // Extended trial handled via apply_special_offer; keep amount unchanged
        offerId = appliedOfferRecord.id;
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

    // Record or update offer redemption if offer was applied
    if (offerId) {
      if (preAppliedRedemptionId) {
        await supabase
          .from("offer_redemptions")
          .update({
            subscription_id: dbSubscription.id,
            discount_applied: discountAmount,
            applied_at: new Date().toISOString(),
          })
          .eq("id", preAppliedRedemptionId);
      } else {
        await supabase.from("offer_redemptions").insert({
          offer_id: offerId,
          user_id: user.id,
          subscription_id: dbSubscription.id,
          discount_applied: discountAmount,
        });
      }
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
