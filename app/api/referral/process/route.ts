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

    // Create referral record (reward will be granted when referred user pays)
    const { data: referralResult, error: createReferralError } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referred_id: user.id,
        referral_code_id: null,
        reward_granted: false,
        payment_verified: false,
      })
      .select()
      .single();

    if (createReferralError) {
      return NextResponse.json(
        { error: "Failed to create referral record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Referral processed successfully! Referrer will receive 1 month free when you complete your first payment.",
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
