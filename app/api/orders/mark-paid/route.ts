import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * POST /api/orders/mark-paid
 * Marks a COD/manual order as paid (store owner only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, storeId } = body || {};

    if (!orderId || !storeId) {
      return NextResponse.json(
        { error: "orderId and storeId are required" },
        { status: 400 }
      );
    }

    // Ensure the order belongs to this store and the store belongs to this user (or user is admin)
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!store) {
      return NextResponse.json(
        { error: "Store not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update the order status to paid
    const { error: updateError, data: updated } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
      .eq("store_id", storeId)
      .select("id, status")
      .maybeSingle();

    if (updateError) {
      console.error("Mark-paid update error:", updateError);
      return NextResponse.json(
        { error: "Failed to mark order as paid" },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Order not found for this store" },
        { status: 404 }
      );
    }

    // Log order event
    await supabase.from("order_events").insert({
      order_id: orderId,
      event: "marked_paid_manual",
      metadata: { by: user.id },
    } as Database["public"]["Tables"]["order_events"]["Insert"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark-paid API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
