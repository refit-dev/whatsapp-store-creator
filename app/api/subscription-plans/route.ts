import { NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * GET /api/subscription-plans
 * Fetch all available subscription plans
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient<Database>({
      cookies: () => cookieStore,
    });

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_cents", { ascending: true });

    if (error) {
      console.error("Error fetching subscription plans:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscription plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (error: any) {
    console.error("Subscription plans API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
