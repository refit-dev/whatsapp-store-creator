import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

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

    // Get user's referral count (only count those where reward was granted)
    const { data: referrals, error: referralError } = await supabase
      .from("referrals")
      .select("id, created_at, reward_granted, payment_verified")
      .eq("referrer_id", user.id);

    if (referralError) {
      return NextResponse.json(
        { error: "Error fetching referrals" },
        { status: 500 }
      );
    }

    const referralCount =
      referrals?.filter((r) => r.reward_granted).length || 0;
    const pendingReferrals =
      referrals?.filter((r) => !r.payment_verified).length || 0;
    const maxReferrals = 999; // No practical limit
    const remainingReferrals = 999; // Unlimited
    const hasReachedLimit = false; // No limit

    // Calculate total free months earned (only granted rewards)
    const freeMonthsEarned = referralCount;

    return NextResponse.json({
      referralCount,
      pendingReferrals,
      maxReferrals,
      remainingReferrals,
      hasReachedLimit,
      freeMonthsEarned,
      unlimited: true,
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
