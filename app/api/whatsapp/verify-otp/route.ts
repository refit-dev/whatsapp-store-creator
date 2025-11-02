import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

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
  const code: string | undefined = body.code;

  if (!storeId || !code) {
    return NextResponse.json(
      { error: "storeId and code are required" },
      { status: 400 }
    );
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

  // Retrieve verification row
  const { data: verif } = await supabase
    .from("whatsapp_verifications")
    .select("otp_code, expires_at, attempts")
    .eq("store_id", storeId)
    .single();

  if (!verif) {
    return NextResponse.json(
      { error: "No OTP found. Please request a new code." },
      { status: 400 }
    );
  }

  const now = Date.now();
  const exp = new Date(verif.expires_at as any).getTime();
  if (now > exp) {
    return NextResponse.json(
      { error: "Code expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Increment attempts
  await supabase
    .from("whatsapp_verifications")
    .update({ attempts: (verif.attempts || 0) + 1 })
    .eq("store_id", storeId);

  if (code.trim() !== verif.otp_code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Mark verified
  const verifiedAt = new Date().toISOString();
  await supabase
    .from("whatsapp_verifications")
    .update({ verified_at: verifiedAt })
    .eq("store_id", storeId);

  return NextResponse.json({ ok: true, verifiedAt });
}
