import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

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
        { error: "User not authenticated" },
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
        { error: "Error checking subscription status" },
        { status: 500 }
      );
    }

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: "Trial already active",
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
      console.error("Error starting trial:", trialError);
      return NextResponse.json(
        { error: "Failed to start trial" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Free trial started successfully!",
      subscriptionId: trialResult,
    });
  } catch (error) {
    console.error("Error in start-trial API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
