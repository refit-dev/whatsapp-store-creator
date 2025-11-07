import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Auto-start trial for authenticated users who don't have an active subscription
 * This endpoint is designed to be called automatically and won't fail the user flow
 */
export async function POST(request: NextRequest) {
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
        {
          success: false,
          error: "User not authenticated",
          shouldStartTrial: false,
        },
        { status: 401 }
      );
    }

    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected if no subscription exists
      console.error("Error checking existing subscription:", checkError);
      return NextResponse.json(
        {
          success: false,
          error: "Error checking subscription status",
          shouldStartTrial: false,
        },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "User already has active subscription",
        shouldStartTrial: false,
        subscriptionId: existingSubscription.id,
      });
    }

    // Call the give_free_trial function
    const { data: trialResult, error: trialError } = await supabase.rpc(
      "give_free_trial",
      {
        user_uuid: user.id,
      }
    );

    if (trialError) {
      console.error("Error auto-starting trial:", trialError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to start trial",
          shouldStartTrial: true,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Auto-trial started successfully!",
      shouldStartTrial: true,
      subscriptionId: trialResult,
    });
  } catch (error) {
    console.error("Error in auto-trial API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        shouldStartTrial: false,
      },
      { status: 500 }
    );
  }
}
