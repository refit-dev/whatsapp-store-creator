import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { WhatsAppAPI } from "@/lib/whatsapp-api";

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

  // Ensure user is owner/admin of the store
  const { data: member } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine phone number to use
  let phoneToUse = phone;
  if (!phoneToUse) {
    const { data: store } = await supabase
      .from("stores")
      .select("whatsapp_e164")
      .eq("id", storeId)
      .single();
    phoneToUse = store?.whatsapp_e164 || undefined;
  }

  if (!phoneToUse) {
    return NextResponse.json(
      { error: "No phone number configured" },
      { status: 400 }
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

  // Send via WhatsApp Business API using a template
  try {
    const api = new WhatsAppAPI();
    await api.sendOtp(phoneToUse, code);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to send OTP" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, expiresAt });
}
