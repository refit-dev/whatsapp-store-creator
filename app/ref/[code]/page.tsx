"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { trackConversion } from "@/lib/analytics";

/**
 * Referral Link Landing Page
 * URL: /ref/{code}
 *
 * Flow:
 * 1. Extract referral code from URL
 * 2. Call track-click API to log click + set cookie
 * 3. Redirect to signup page
 */
export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const referralCode = params.code as string;
  const [status, setStatus] = useState<"processing" | "redirecting" | "error">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const trackAndRedirect = async () => {
      try {
        if (!referralCode) {
          setErrorMessage("Invalid referral link");
          setStatus("error");
          return;
        }

        // Extract tracking info
        const landingPage = window.location.href;
        const referrer = document.referrer || "direct";

        // Parse UTM parameters from URL
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams = {
          utm_source: urlParams.get("utm_source") || undefined,
          utm_medium: urlParams.get("utm_medium") || undefined,
          utm_campaign: urlParams.get("utm_campaign") || undefined,
          utm_term: urlParams.get("utm_term") || undefined,
          utm_content: urlParams.get("utm_content") || undefined,
        };

        // Track click and set cookie
        const response = await fetch("/api/affiliate/track-click", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referral_code: referralCode,
            landing_page: landingPage,
            referrer,
            utm_params: utmParams,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          setErrorMessage(data.error || "Invalid referral code");
          setStatus("error");

          // Still redirect to homepage after 2 seconds
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        // Track GA4 event
        trackConversion("referral_link_clicked", {
          referral_code: referralCode,
          click_id: data.click_id,
          utm_source: utmParams.utm_source,
          utm_campaign: utmParams.utm_campaign,
        });

        // Success - redirect to signup
        setStatus("redirecting");

        // Redirect to signup page with referral context
        router.push("/auth/sign-up?ref=" + referralCode);
      } catch (error) {
        console.error("Error tracking referral:", error);
        setErrorMessage("Something went wrong. Redirecting...");
        setStatus("error");

        // Fallback redirect after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    };

    trackAndRedirect();
  }, [referralCode, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "processing" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing your referral...
            </h2>
            <p className="text-gray-600">
              Please wait while we set things up for you.
            </p>
          </>
        )}

        {status === "redirecting" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Referral applied!
            </h2>
            <p className="text-gray-600">
              Redirecting you to create your store...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex items-center justify-center mb-4">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {errorMessage || "Something went wrong"}
            </h2>
            <p className="text-gray-600">Redirecting you to our homepage...</p>
          </>
        )}
      </div>
    </div>
  );
}
