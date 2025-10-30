import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let formatted = phone.replace(/[^\d+]/g, "");

  // Add + if not present
  if (!formatted.startsWith("+")) {
    // Assume Indian number if no country code
    if (formatted.length === 10) {
      formatted = "+91" + formatted;
    } else {
      formatted = "+" + formatted;
    }
  }

  return formatted;
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, code, userId } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Find valid verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("contact", formattedPhone)
      .eq("type", "mobile")
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !verificationData) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Mark code as used
    const { error: updateCodeError } = await supabase
      .from("verification_codes")
      .update({ used: true })
      .eq("id", verificationData.id);

    if (updateCodeError) {
      console.error("Error updating verification code:", updateCodeError);
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 500 }
      );
    }

    // Update user's mobile verification status and store mobile number
    if (userId) {
      // Update user_metadata for immediate use
      const supabaseAdmin = supabaseServer();
      const { error: updateUserError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            mobile_verified: true,
            mobile_number: formattedPhone,
          },
        });

      if (updateUserError) {
        console.error(
          "Error updating user verification status:",
          updateUserError
        );
        // Don't fail the request as the code was valid
      }

      // Also update user_profiles table
      const { error: updateProfileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userId,
          mobile_verified: true,
          mobile_number: formattedPhone,
          updated_at: new Date().toISOString(),
        });

      if (updateProfileError) {
        console.error("Error updating user profile:", updateProfileError);
      }
    }

    // Clean up old verification codes for this phone number
    await supabase
      .from("verification_codes")
      .delete()
      .eq("contact", formattedPhone)
      .eq("type", "mobile")
      .neq("id", verificationData.id);

    return NextResponse.json({
      success: true,
      message: "Mobile number verified successfully!",
      verifiedPhone: formattedPhone,
    });
  } catch (error: any) {
    console.error("Mobile verification validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
