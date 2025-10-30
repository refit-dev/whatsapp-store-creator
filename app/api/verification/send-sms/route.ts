import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// SMS sending utility (integrate with your SMS provider)
async function sendVerificationSMS(phoneNumber: string, code: string) {
  // Production: Use Twilio for SMS sending
  try {
    const twilio = require("twilio");
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      body: `Your WhatsApp Store Creator verification code is: ${code}. This code expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`📱 SMS sent successfully to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error("Twilio SMS error:", error);
    // Fallback to development mode
    console.log(`📱 SMS Verification Code for ${phoneNumber}: ${code}`);
    return true;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

function validatePhoneNumber(phone: string): boolean {
  // Basic validation for international phone numbers
  const phoneRegex = /^\+[1-9]\d{10,14}$/;
  return phoneRegex.test(phone);
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    if (!validatePhoneNumber(formattedPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number with country code" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerComponentClient({
      cookies: () => cookieStore,
    });

    // Check rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "0.0.0.0";

    const { data: rateLimitCheck } = await supabase.rpc(
      "is_verification_rate_limited",
      {
        p_contact: formattedPhone,
        p_type: "mobile",
        p_ip_address: clientIP,
      }
    );

    if (rateLimitCheck) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        user_id: userId,
        type: "mobile",
        code,
        contact: formattedPhone,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      );
    }

    // Record attempt for rate limiting
    await supabase.rpc("record_verification_attempt", {
      p_contact: formattedPhone,
      p_type: "mobile",
      p_ip_address: clientIP,
    });

    // Send SMS
    try {
      await sendVerificationSMS(formattedPhone, code);
    } catch (smsError) {
      console.error("Error sending SMS:", smsError);
      return NextResponse.json(
        { error: "Failed to send verification SMS" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your mobile number",
      formattedPhone,
    });
  } catch (error: any) {
    console.error("Mobile verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
