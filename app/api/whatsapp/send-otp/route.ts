import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { TwilioSMS } from "@/lib/twilio-sms";

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const storeId: string | undefined = body.storeId;
  const phone: string | undefined = body.phone;

  if (!storeId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  // Ensure user is owner or member of the store
  const { data: store } = await supabase
    .from("stores")
    .select("owner_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Check if user is the owner
  const isOwner = store.owner_id === user.id;

  // Check if user is a member (if not owner)
  let isMember = false;
  if (!isOwner) {
    const { data: member } = await supabase
      .from("store_members")
      .select("role")
      .eq("store_id", storeId)
      .eq("user_id", user.id)
      .maybeSingle();
    isMember = !!member;
  }

  if (!isOwner && !isMember) {
    return NextResponse.json(
      { error: "Forbidden - You don't have access to this store" },
      { status: 403 }
    );
  }

  // Determine phone number to use
  let phoneToUse = phone;
  if (!phoneToUse) {
    // Get the whatsapp number from the store
    const { data: storeData } = await supabase
      .from("stores")
      .select("whatsapp_e164")
      .eq("id", storeId)
      .single();
    phoneToUse = storeData?.whatsapp_e164 || undefined;
  }

  if (!phoneToUse) {
    return NextResponse.json(
      { error: "No phone number configured" },
      { status: 400 }
    );
  }

  // Initialize Twilio SMS service
  let smsService: TwilioSMS;
  try {
    smsService = new TwilioSMS();

    // Validate phone number format
    const isValid = await smsService.validatePhoneNumber(phoneToUse);
    if (!isValid) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Please use E.164 format (e.g., +1234567890)",
        },
        { status: 400 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "SMS service not configured. Please contact support." },
      { status: 500 }
    );
  }

  // Generate a 6-digit OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert verification row
  await supabase.from("whatsapp_verifications").upsert({
    store_id: storeId,
    phone_e164: phoneToUse,
    otp_code: code,
    expires_at: expiresAt.toISOString(),
    verified_at: null,
    attempts: 0,
  });

  // Send via Twilio SMS
  try {
    await smsService.sendOtp(phoneToUse, code);
  } catch (e: any) {
    const errorMessage = e.message || "Failed to send SMS";

    // Check if it's a Twilio trial account error
    if (
      errorMessage.includes("unverified") ||
      errorMessage.includes("Trial accounts")
    ) {
      return NextResponse.json(
        {
          error: "Twilio Trial Account: Please verify your phone number first",
          details: `1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new number"
3. Enter ${phoneToUse} and verify it
4. Or upgrade your Twilio account to send to any number

Trial accounts can only send SMS to verified numbers.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expiresAt });
}
