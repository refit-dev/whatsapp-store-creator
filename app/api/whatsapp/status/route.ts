import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const storeId = url.searchParams.get("storeId");
  if (!storeId)
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure requester is owner/admin
  const { data: member } = await supabase
    .from("store_members")
    .select("role")
    .eq("store_id", storeId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: verif } = await supabase
    .from("whatsapp_verifications")
    .select("phone_e164, expires_at, verified_at, attempts")
    .eq("store_id", storeId)
    .maybeSingle();

  return NextResponse.json({
    phone: verif?.phone_e164 || null,
    verified: Boolean(verif?.verified_at),
    verifiedAt: verif?.verified_at || null,
    expiresAt: verif?.expires_at || null,
    attempts: verif?.attempts ?? 0,
  });
}
