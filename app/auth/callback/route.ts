import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL("/auth?error=auth_failed", request.url)
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
    } catch (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL("/auth?error=auth_failed", request.url)
      );
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
