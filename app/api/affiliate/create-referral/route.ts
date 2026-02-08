import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * POST /api/affiliate/create-referral
 * Create a referral record when a referred user signs up
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Verify user is authenticated
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { user_id, referral_code } = body;

    if (!user_id || !referral_code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: user_id and referral_code",
        },
        { status: 400 }
      );
    }

    // Verify referral code exists and get affiliate ID
    const { data: partner, error: partnerError } = await supabase
      .from("affiliate_partners")
      .select("id, status")
      .eq("referral_code", referral_code)
      .eq("status", "active")
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or inactive referral code",
        },
        { status: 404 }
      );
    }

    // Check if referral record already exists (prevent duplicates)
    const { data: existingReferral } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("referred_user_id", user_id)
      .single();

    if (existingReferral) {
      return NextResponse.json(
        {
          success: true,
          message: "Referral already exists",
          referral_id: existingReferral.id,
        },
        { status: 200 }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("email")
      .eq("id", user_id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Create referral record
    const { data: referral, error: referralError } = await supabase
      .from("affiliate_referrals")
      .insert({
        affiliate_id: partner.id,
        referred_user_id: user_id,
        referral_code,
        converted: false,
        converted_at: null,
      })
      .select()
      .single();

    if (referralError || !referral) {
      console.error("Error creating referral:", referralError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create referral record",
        },
        { status: 500 }
      );
    }

    // Update affiliate partner's referral count
    const { error: updateError } = await supabase.rpc(
      "increment_affiliate_referrals",
      {
        p_affiliate_id: partner.id,
      }
    );

    if (updateError) {
      console.error("Error updating referral count:", updateError);
      // Don't fail the request if counter update fails
    }

    console.log(`✅ Referral created: ${user_id} referred by ${partner.id}`);

    return NextResponse.json(
      {
        success: true,
        referral_id: referral.id,
        message: "Referral recorded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
