import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import type {
  TrackReferralClickRequest,
  TrackReferralClickResponse,
} from "@/types/affiliate";
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_EXPIRY_DAYS,
} from "@/types/affiliate";

/**
 * POST /api/affiliate/track-click
 * Track a referral link click and set attribution cookie
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Parse request body
    const body: TrackReferralClickRequest = await req.json();
    const { referral_code, landing_page, referrer, utm_params } = body;

    if (!referral_code) {
      return NextResponse.json<TrackReferralClickResponse>(
        {
          success: false,
          error: "Referral code is required",
        },
        { status: 400 }
      );
    }

    // Verify referral code exists and get affiliate ID
    const { data: partner, error: partnerError } = await supabase
      .from("affiliate_partners")
      .select("id, status")
      .eq("referral_code", referral_code)
      .eq("status", "active")
      .single();

    if (partnerError || !partner) {
      return NextResponse.json<TrackReferralClickResponse>(
        {
          success: false,
          error: "Invalid or inactive referral code",
        },
        { status: 404 }
      );
    }

    // Extract device and location info from headers
    const userAgent = req.headers.get("user-agent") || "";
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "";

    // Hash IP for privacy
    const hashedIp = await hashString(ipAddress);

    // Detect device type
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Insert click record
    const { data: clickRecord, error: clickError } = await supabase
      .from("affiliate_clicks")
      .insert({
        affiliate_id: partner.id,
        referral_code,
        landing_page,
        referrer,
        user_agent: userAgent,
        ip_address: hashedIp,
        device_info: {
          browser,
          os,
          device_type: deviceType,
        },
        converted: false,
      })
      .select()
      .single();

    if (clickError || !clickRecord) {
      console.error("Error creating click record:", clickError);
      // Don't fail the request, just log
    }

    // Set attribution cookie
    const cookieValue = JSON.stringify({
      referral_code,
      clicked_at: Date.now(),
      expires_at:
        Date.now() + REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      click_id: clickRecord?.id || null,
    });

    const response = NextResponse.json<TrackReferralClickResponse>(
      {
        success: true,
        click_id: clickRecord?.id,
      },
      { status: 200 }
    );

    // Set cookie with 30-day expiry
    response.cookies.set(REFERRAL_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error tracking referral click:", error);
    return NextResponse.json<TrackReferralClickResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/affiliate/track-click
 * Check if user has an active referral cookie
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const referralCookie = cookieStore.get(REFERRAL_COOKIE_NAME);

    if (!referralCookie) {
      return NextResponse.json(
        {
          success: true,
          has_referral: false,
        },
        { status: 200 }
      );
    }

    try {
      const cookieData = JSON.parse(referralCookie.value);

      // Check if cookie is expired
      if (Date.now() > cookieData.expires_at) {
        return NextResponse.json(
          {
            success: true,
            has_referral: false,
            expired: true,
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          has_referral: true,
          referral_code: cookieData.referral_code,
          days_remaining: Math.ceil(
            (cookieData.expires_at - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        },
        { status: 200 }
      );
    } catch (parseError) {
      return NextResponse.json(
        {
          success: true,
          has_referral: false,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error checking referral cookie:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ==========================================
// Helper Functions
// ==========================================

async function hashString(input: string): Promise<string> {
  if (!input) return "";

  // Simple hash for privacy (in production, use crypto)
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" {
  const ua = userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }

  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }

  return "desktop";
}

function getBrowser(userAgent: string): string {
  const ua = userAgent;

  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera")) return "Opera";

  return "Other";
}

function getOS(userAgent: string): string {
  const ua = userAgent;

  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "MacOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";

  return "Other";
}
