import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * POST /api/orders/confirm-whatsapp
 * Updates order status when customer confirms they've sent WhatsApp message
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Parse request body
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    // Verify order exists and is in appropriate status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, store_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Only allow confirmation for orders in 'created' or 'opened_whatsapp' status
    if (order.status !== "created" && order.status !== "opened_whatsapp") {
      return NextResponse.json(
        {
          error: "Order cannot be confirmed in its current status",
          currentStatus: order.status,
        },
        { status: 400 }
      );
    }

    // Update order status to customer_confirmed
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "customer_confirmed" as any,
        whatsapp_sent_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // TODO: Send notification to store owner (future enhancement)
    // await notifyStoreOwner(order.store_id, orderId);

    return NextResponse.json({
      success: true,
      message: "Order confirmed successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Confirm WhatsApp API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
