"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Handles authentication redirects when users land on the homepage
 * with auth tokens in the URL hash (magic links, password resets, etc.)
 */
export default function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthRedirect = async () => {
      const supabase = supabaseBrowser();

      // Check if we have auth tokens in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      // If we have tokens, process them
      if (accessToken && type) {
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Error setting session:", error);
            // Redirect to auth page with error
            router.push(`/auth?error=${encodeURIComponent(error.message)}`);
            return;
          }

          if (data.session) {
            // Check if user needs a trial
            try {
              const { data: existingSubscription, error: checkError } =
                await supabase
                  .from("user_subscriptions")
                  .select("*")
                  .eq("user_id", data.session.user.id)
                  .eq("status", "active")
                  .single();

              // If no active subscription exists, start a trial
              if (checkError && checkError.code === "PGRST116") {
                await supabase.rpc("give_free_trial", {
                  user_uuid: data.session.user.id,
                });
              }
            } catch (trialError) {
              console.error("Error in auto-trial logic:", trialError);
              // Don't block login
            }

            // Clear the URL hash
            window.history.replaceState(null, "", window.location.pathname);

            // Add a small delay to ensure session is set
            setTimeout(() => {
              // For password reset (recovery), redirect to reset-password page
              if (type === "recovery") {
                router.push("/auth/reset-password");
              } else {
                // For other types (magic link, signup), redirect to dashboard
                router.push("/dashboard");
              }
            }, 100);
          }
        } catch (error) {
          console.error("Error handling auth redirect:", error);
        }
      }

      // Also handle the 'code' parameter from password reset emails
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        // This is a password reset code
        // Clear the URL and redirect to password reset page with the code
        router.push(`/auth/reset-password?code=${code}`);
      }
    };

    handleAuthRedirect();
  }, [router]);

  // This component doesn't render anything
  return null;
}
