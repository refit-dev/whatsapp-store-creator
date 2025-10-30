import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, code, userId } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Find valid verification code
    const { data: verificationData, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("contact", email)
      .eq("type", "email")
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

    // Update user's email verification status
    if (userId) {
      // Update user_metadata for immediate use
      const supabaseAdmin = supabaseServer();
      const { error: updateUserError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            email_verified: true,
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
          email_verified: true,
          updated_at: new Date().toISOString(),
        });

      if (updateProfileError) {
        console.error("Error updating user profile:", updateProfileError);
      }
    }

    // Clean up old verification codes for this email
    await supabase
      .from("verification_codes")
      .delete()
      .eq("contact", email)
      .eq("type", "email")
      .neq("id", verificationData.id);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error: any) {
    console.error("Email verification validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
