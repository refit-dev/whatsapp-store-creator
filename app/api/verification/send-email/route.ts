import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Email sending utility (you can replace with your preferred service)
async function sendVerificationEmail(
  email: string,
  code: string,
  name?: string
) {
  // For development, just log the code
  console.log(`📧 Email Verification Code for ${email}: ${code}`);

  // In production, integrate with your email service (SendGrid, AWS SES, etc.)
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Verify your email - WhatsApp Store Creator',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Please use this verification code to complete your registration:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #333; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">WhatsApp Store Creator</p>
      </div>
    `
  };
  
  await sgMail.send(msg);
  */

  return true;
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
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
        p_contact: email,
        p_type: "email",
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
        type: "email",
        code,
        contact: email,
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
      p_contact: email,
      p_type: "email",
      p_ip_address: clientIP,
    });

    // Send email
    try {
      await sendVerificationEmail(email, code);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
