import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if referral code exists and get referrer
    const { data: referralData, error: referralError } = await supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", referralCode)
      .single();

    if (referralError || !referralData) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 400 }
      );
    }

    const referrerId = referralData.user_id;

    // Check if user is trying to refer themselves
    if (referrerId === user.id) {
      return NextResponse.json(
        { error: "Cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Check if user has already used a referral code
    const { data: existingReferral, error: existingError } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_id", user.id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        { error: "You have already used a referral code" },
        { status: 400 }
      );
    }

    // Check referrer's current referral count (6-month limit)
    const { data: referrerReferrals, error: countError } = await supabase
      .from("referrals")
      .select("id")
      .eq("referrer_id", referrerId);

    if (countError) {
      return NextResponse.json(
        { error: "Error checking referral limit" },
        { status: 500 }
      );
    }

    const referralCount = referrerReferrals?.length || 0;

    if (referralCount >= 6) {
      return NextResponse.json(
        {
          error: "Referrer has reached maximum referral limit (6 months free)",
          canStillSignUp: true,
        },
        { status: 400 }
      );
    }

    // Start transaction to create referral and extend subscription
    const { data: referralResult, error: createReferralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: user.id,
        referral_code_id: null, // We'll update this if needed
      })
      .select()
      .single();

    if (createReferralError) {
      return NextResponse.json(
        { error: "Failed to create referral record" },
        { status: 500 }
      );
    }

    // Extend referrer's subscription using the database function
    const { data: extensionResult, error: extensionError } = await supabase.rpc(
      "extend_subscription",
      {
        user_uuid: referrerId,
        days: 30,
      }
    );

    if (extensionError) {
      // If extension fails, remove the referral record
      await supabase.from("referrals").delete().eq("id", referralResult.id);

      return NextResponse.json(
        { error: "Failed to extend referrer subscription" },
        { status: 500 }
      );
    }

    // Check if extension was successful (function returns boolean)
    if (!extensionResult) {
      // Extension was limited due to 6-month cap
      return NextResponse.json({
        success: true,
        message:
          "Referral processed successfully. Referrer has reached the 6-month free limit.",
        limitReached: true,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Referral processed successfully! Referrer received 1 month free.",
      limitReached: false,
    });
  } catch (error) {
    console.error("Error processing referral:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
