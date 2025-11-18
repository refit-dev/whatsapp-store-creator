import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { cancelOrder, CancellationReason } from "@/lib/order-cancellation";
import type { Database } from "@/types/supabase";

/**
 * POST /api/orders/cancel
 * Cancel an order and process refund
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { orderId, storeId, reason, notes, refundAmount } = body;

    if (!orderId || !storeId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, storeId, reason" },
        { status: 400 }
      );
    }

    // Validate reason
    const validReasons = [
      "out_of_stock",
      "customer_request",
      "pricing_error",
      "address_issue",
      "duplicate_order",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "Invalid cancellation reason" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedNotes = notes ? String(notes).substring(0, 500) : undefined;
    const sanitizedRefundAmount = refundAmount
      ? parseFloat(refundAmount)
      : undefined;

    // Cancel the order
    const result = await cancelOrder({
      orderId: String(orderId),
      storeId: String(storeId),
      userId: user.id,
      reason: reason as CancellationReason,
      notes: sanitizedNotes,
      refundAmount: sanitizedRefundAmount,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel order" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      refunded: result.refunded,
      refundAmount: result.refundAmount,
      refundId: result.refundId,
      message: result.refunded
        ? "Order cancelled and refund processed successfully"
        : "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Order cancellation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/orders/cancel
 * Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
