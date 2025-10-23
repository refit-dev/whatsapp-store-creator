import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";

const schema = z.object({ orderId: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = schema.parse(body);

    const supabase = createServerClient();

    await supabase
      .from("orders")
      .update({
        status: "opened_whatsapp",
      } as Database["public"]["Tables"]["orders"]["Update"])
      .eq("id", orderId);

    await supabase.from("order_events").insert({
      order_id: orderId,
      event: "opened_whatsapp",
    } as Database["public"]["Tables"]["order_events"]["Insert"]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
