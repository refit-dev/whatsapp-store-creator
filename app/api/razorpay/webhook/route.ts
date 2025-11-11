import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body.payload.payment.entity.receipt;

    const supabase = createServerClient(true); // Use service role

    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (order && order.status !== "paid") {
      // Update order status
      // Note: Inventory is already reduced when order is created
      await supabase
        .from("orders")
        .update({
          status: "paid",
        } as Database["public"]["Tables"]["orders"]["Update"])
        .eq("id", orderId);

      console.log("✅ Order marked as paid:", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
