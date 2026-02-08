import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import type {
  CreateAffiliatePartnerRequest,
  CreateAffiliatePartnerResponse,
} from "@/types/affiliate";

/**
 * POST /api/affiliate/register
 * Register a new affiliate partner
 *
 * For authenticated users: Links affiliate account to their user account
 * For non-authenticated: Creates affiliate record and sends email to complete setup
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Parse request body
    const body: CreateAffiliatePartnerRequest = await req.json();

    // Validate required fields
    if (!body.contact_email) {
      return NextResponse.json(
        { success: false, error: "Contact email is required" },
        { status: 400 },
      );
    }

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If not authenticated, check if a user with this email exists
    let userId: string;

    if (user) {
      userId = user.id;
    } else {
      // Find or suggest creating an account
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", body.contact_email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Please log in with your Watzy account to register as an affiliate partner",
            redirect: `/auth?email=${encodeURIComponent(body.contact_email)}`,
          },
          { status: 401 },
        );
      }

      // Return message to create account first
      return NextResponse.json(
        {
          success: false,
          error: "Please create an affiliate account at /affiliate/signup",
          redirect: `/affiliate/signup`,
        },
        { status: 401 },
      );
    }

    // Check if user already has an affiliate account
    const { data: existingPartner } = await supabase
      .from("affiliate_partners")
      .select("id, referral_code")
      .eq("user_id", userId)
      .single();

    if (existingPartner) {
      return NextResponse.json<CreateAffiliatePartnerResponse>(
        {
          success: false,
          error: "You already have an affiliate account",
        },
        { status: 400 },
      );
    }

    // Get email for referral code generation
    const userEmail = user?.email || body.contact_email;
    const baseName = body.company_name || userEmail.split("@")[0] || "PARTNER";

    // Generate unique referral code
    const { data: generatedCode, error: codeError } = await supabase.rpc(
      "generate_referral_code",
      { base_name: baseName },
    );

    if (codeError || !generatedCode) {
      console.error("Error generating referral code:", codeError);
      return NextResponse.json<CreateAffiliatePartnerResponse>(
        {
          success: false,
          error: "Failed to generate referral code",
        },
        { status: 500 },
      );
    }

    // Create affiliate partner record
    const { data: newPartner, error: insertError } = await supabase
      .from("affiliate_partners")
      .insert({
        user_id: userId,
        referral_code: generatedCode,
        commission_rate: 0.2, // 20%
        status: "active", // Auto-approve for now
        bio: body.bio,
        website: body.website,
        social_links: body.social_links,
        payment_method: body.payment_method,
        payment_details: body.payment_details,
        total_earnings: 0,
        pending_payout: 0,
      })
      .select()
      .single();

    if (insertError || !newPartner) {
      console.error("Error creating affiliate partner:", insertError);
      return NextResponse.json<CreateAffiliatePartnerResponse>(
        {
          success: false,
          error: "Failed to create affiliate account",
        },
        { status: 500 },
      );
    }

    // Generate referral link
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.APP_URL ||
      "https://example.com";
    const referralLink = `${baseUrl}/ref/${newPartner.referral_code}`;

    return NextResponse.json<CreateAffiliatePartnerResponse>(
      {
        success: true,
        data: {
          partner: newPartner,
          referral_link: referralLink,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in affiliate registration:", error);
    return NextResponse.json<CreateAffiliatePartnerResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/affiliate/register
 * Get current user's affiliate partner status
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get partner record
    const { data: partner, error } = await supabase
      .from("affiliate_partners")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching affiliate partner:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch partner data" },
        { status: 500 },
      );
    }

    if (!partner) {
      return NextResponse.json({ success: true, data: null }, { status: 200 });
    }

    // Generate referral link
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.APP_URL ||
      "https://example.com";
    const referralLink = `${baseUrl}/ref/${partner.referral_code}`;

    return NextResponse.json<CreateAffiliatePartnerResponse>(
      {
        success: true,
        data: {
          partner,
          referral_link: referralLink,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in affiliate status check:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
