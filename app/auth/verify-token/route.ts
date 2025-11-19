import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  // Use token_hash if available, otherwise use token
  const authToken = token_hash || token;

  // Handle magic link authentication
  if (authToken && type) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    try {
      // Verify the OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash: authToken as string,
      });

      if (error) {
        console.error("Error verifying OTP:", error);
        return NextResponse.redirect(
          new URL(
            `/auth?error=${encodeURIComponent(error.message)}`,
            requestUrl.origin
          )
        );
      }

      // If we have a user (successful login), check if they need a trial
      if (data.user) {
        try {
          // Check if user already has an active subscription
          const { data: existingSubscription, error: checkError } =
            await supabase
              .from("user_subscriptions")
              .select("*")
              .eq("user_id", data.user.id)
              .eq("status", "active")
              .single();

          // If no active subscription exists (PGRST116 = not found), start a trial
          if (checkError && checkError.code === "PGRST116") {
            // Call the give_free_trial function
            const { error: trialError } = await supabase.rpc(
              "give_free_trial",
              {
                user_uuid: data.user.id,
              }
            );

            if (trialError) {
              console.error("Error auto-starting trial:", trialError);
              // Don't block login if trial creation fails
            } else {
              console.log("Auto-started trial for new user:", data.user.id);
            }
          } else if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking subscription status:", checkError);
            // Don't block login
          }
        } catch (trialError) {
          console.error("Error in auto-trial logic:", trialError);
          // Don't block login if trial logic fails
        }
      }

      // Successful authentication
      // For password reset (recovery), redirect to reset-password page
      if (type === "recovery") {
        return NextResponse.redirect(
          new URL("/auth/reset-password", requestUrl.origin)
        );
      }

      // For other types, redirect to dashboard or specified next page
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (error) {
      console.error("Error in confirm handler:", error);
      return NextResponse.redirect(
        new URL("/auth?error=Authentication failed", requestUrl.origin)
      );
    }
  }

  // If no token_hash or token, redirect to auth page
  return NextResponse.redirect(new URL("/auth", requestUrl.origin));
}
