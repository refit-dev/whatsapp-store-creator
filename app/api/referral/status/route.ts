import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
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

    // Get user's referral count
    const { data: referrals, error: referralError } = await supabase
      .from("referrals")
      .select("id, created_at")
      .eq("referrer_id", user.id);

    if (referralError) {
      return NextResponse.json(
        { error: "Error fetching referrals" },
        { status: 500 }
      );
    }

    const referralCount = referrals?.length || 0;
    const maxReferrals = 6;
    const remainingReferrals = Math.max(0, maxReferrals - referralCount);
    const hasReachedLimit = referralCount >= maxReferrals;

    // Calculate total free months earned
    const freeMonthsEarned = referralCount;
    const maxFreeMonths = 6;

    return NextResponse.json({
      referralCount,
      maxReferrals,
      remainingReferrals,
      hasReachedLimit,
      freeMonthsEarned,
      maxFreeMonths,
      referralHistory: referrals || [],
    });
  } catch (error) {
    console.error("Error checking referral status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
