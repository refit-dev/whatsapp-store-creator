import { cookies } from "next/headers";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_EXPIRY_DAYS,
} from "@/types/affiliate";

interface ReferralCookieData {
  referral_code: string;
  clicked_at: number;
  expires_at: number;
  click_id: string | null;
}

/**
 * Server-side cookie management utilities for affiliate attribution
 * Use these in server components and API routes
 */

/**
 * Get referral cookie data (server-side)
 * @returns ReferralCookieData if cookie exists and is valid, null otherwise
 */
export async function getReferralCookie(): Promise<ReferralCookieData | null> {
  try {
    const cookieStore = await cookies();
    const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME);

    if (!referralCookie) {
      return null;
    }

    const cookieData: ReferralCookieData = JSON.parse(referralCookie.value);

    // Check if cookie is expired
    if (Date.now() > cookieData.expires_at) {
      // Cookie expired, clear it
      await clearReferralCookie();
      return null;
    }

    return cookieData;
  } catch (error) {
    console.error("Error reading referral cookie:", error);
    return null;
  }
}

/**
 * Set referral cookie (server-side)
 * @param referralCode - The affiliate's unique referral code
 * @param clickId - Optional click ID from affiliate_clicks table
 */
export async function setReferralCookie(
  referralCode: string,
  clickId: string | null = null
): Promise<void> {
  try {
    const cookieData: ReferralCookieData = {
      referral_code: referralCode,
      clicked_at: Date.now(),
      expires_at:
        Date.now() + REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      click_id: clickId,
    };

    const cookieStore = await cookies();

    cookieStore.set(REFERRAL_COOKIE_NAME, JSON.stringify(cookieData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
      path: "/",
    });
  } catch (error) {
    console.error("Error setting referral cookie:", error);
  }
}

/**
 * Clear referral cookie (server-side)
 */
export async function clearReferralCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(REFERRAL_COOKIE_NAME);
  } catch (error) {
    console.error("Error clearing referral cookie:", error);
  }
}

/**
 * Check if user was referred by an affiliate
 * @returns true if valid referral cookie exists
 */
export async function hasActiveReferral(): Promise<boolean> {
  const cookieData = await getReferralCookie();
  return cookieData !== null;
}

/**
 * Get referral code from cookie
 * @returns referral code string or null
 */
export async function getReferralCode(): Promise<string | null> {
  const cookieData = await getReferralCookie();
  return cookieData?.referral_code || null;
}

/**
 * Get days remaining until cookie expires
 * @returns number of days or null if no cookie
 */
export async function getReferralDaysRemaining(): Promise<number | null> {
  const cookieData = await getReferralCookie();

  if (!cookieData) {
    return null;
  }

  const daysRemaining = Math.ceil(
    (cookieData.expires_at - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, daysRemaining);
}

/**
 * Client-side utilities (use in client components)
 * These make fetch calls to the API instead of direct cookie access
 */
export const clientSide = {
  /**
   * Check if user has an active referral (client-side)
   */
  async checkReferral(): Promise<{
    has_referral: boolean;
    referral_code?: string;
    days_remaining?: number;
    expired?: boolean;
  }> {
    try {
      const response = await fetch("/api/affiliate/track-click", {
        method: "GET",
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking referral:", error);
      return { has_referral: false };
    }
  },

  /**
   * Track a referral click (client-side)
   */
  async trackClick(params: {
    referral_code: string;
    landing_page?: string;
    referrer?: string;
    utm_params?: Record<string, string | undefined>;
  }): Promise<{ success: boolean; click_id?: string; error?: string }> {
    try {
      const response = await fetch("/api/affiliate/track-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referral_code: params.referral_code,
          landing_page: params.landing_page || window.location.href,
          referrer: params.referrer || document.referrer || "direct",
          utm_params: params.utm_params || {},
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error tracking click:", error);
      return {
        success: false,
        error: "Failed to track referral click",
      };
    }
  },
};
