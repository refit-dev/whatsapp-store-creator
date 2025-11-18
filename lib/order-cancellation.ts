/**
 * Order Cancellation System
 * Allows store owners to cancel orders with refund handling
 */

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type CancellationReason =
  | "out_of_stock"
  | "customer_request"
  | "pricing_error"
  | "address_issue"
  | "duplicate_order"
  | "other";

export interface CancelOrderParams {
  orderId: string;
  storeId: string;
  userId: string; // Store owner's user ID
  reason: CancellationReason;
  notes?: string;
  refundAmount?: number; // Optional partial refund
}

export interface CancelOrderResult {
  success: boolean;
  orderId: string;
  refunded: boolean;
  refundAmount?: number;
  refundId?: string;
  error?: string;
}

/**
 * Cancel an order and process refund if payment was made
 */
export async function cancelOrder(
  params: CancelOrderParams,
  supabaseClient?: SupabaseClient
): Promise<CancelOrderResult> {
  // Use service role client to bypass RLS
  const supabase =
    supabaseClient ||
    createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

  try {
    // 1. Verify store ownership
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, owner_id")
      .eq("id", params.storeId)
      .eq("owner_id", params.userId)
      .single();

    if (storeError || !store) {
      return {
        success: false,
        orderId: params.orderId,
        refunded: false,
        error: "Unauthorized: You do not own this store",
      };
    }

    // 2. Get order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", params.orderId)
      .eq("store_id", params.storeId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        orderId: params.orderId,
        refunded: false,
        error: "Order not found",
      };
    }

    // Cast order to any to avoid TypeScript issues with dynamic columns
    const orderData = order as any;

    // 3. Check if order can be cancelled
    if (orderData.status === "cancelled") {
      return {
        success: false,
        orderId: params.orderId,
        refunded: false,
        error: "Order is already cancelled",
      };
    }

    if (orderData.status === "delivered" || orderData.status === "completed") {
      return {
        success: false,
        orderId: params.orderId,
        refunded: false,
        error:
          "Cannot cancel delivered orders. Please process a refund instead.",
      };
    }

    // 4. Process refund if payment was made
    let refundResult: {
      success: boolean;
      refundId?: string;
      amount?: number;
      error?: string;
    } = { success: false };

    if (orderData.payment_status === "paid" && orderData.payment_intent_id) {
      const refundAmount = params.refundAmount || orderData.total;

      if (orderData.payment_provider === "stripe") {
        refundResult = await processStripeRefund(
          orderData.payment_intent_id,
          refundAmount
        );
      } else if (orderData.payment_provider === "razorpay") {
        refundResult = await processRazorpayRefund(
          orderData.payment_intent_id,
          refundAmount
        );
      }

      if (!refundResult.success) {
        return {
          success: false,
          orderId: params.orderId,
          refunded: false,
          error: `Refund failed: ${refundResult.error}`,
        };
      }
    }

    // 5. Update order status
    // @ts-ignore - Dynamic columns not in schema
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: params.reason,
        cancellation_notes: params.notes,
        cancelled_at: new Date().toISOString(),
        cancelled_by: params.userId,
        payment_status: refundResult.success
          ? "refunded"
          : orderData.payment_status,
        refund_id: refundResult.refundId,
        refund_amount: refundResult.amount,
      })
      .eq("id", params.orderId);

    if (updateError) {
      return {
        success: false,
        orderId: params.orderId,
        refunded: false,
        error: "Failed to update order status",
      };
    }

    // 6. Restore product stock (if inventory tracking is enabled)
    if (orderData.items && Array.isArray(orderData.items)) {
      for (const item of orderData.items as Array<{
        product_id: string;
        quantity: number;
      }>) {
        // Get current stock and increment
        const { data: product } = await supabase
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (product) {
          const prodData = product as any;
          const newStock = (prodData.stock || 0) + item.quantity;
          // @ts-ignore - Dynamic column update
          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", item.product_id);
        }
      }
    }

    // 7. Log cancellation
    const { error: logError } = await supabase
      .from("order_cancellation_logs")
      .insert({
        order_id: params.orderId,
        store_id: params.storeId,
        cancelled_by: params.userId,
        reason: params.reason,
        notes: params.notes,
        refund_processed: refundResult.success,
        refund_amount: refundResult.amount,
        refund_id: refundResult.refundId,
      } as any);

    if (logError) {
      console.error("Failed to log cancellation:", logError);
      // Don't fail the cancellation if logging fails
    }

    return {
      success: true,
      orderId: params.orderId,
      refunded: refundResult.success,
      refundAmount: refundResult.amount,
      refundId: refundResult.refundId,
    };
  } catch (error) {
    console.error("Order cancellation error:", error);
    return {
      success: false,
      orderId: params.orderId,
      refunded: false,
      error: "Internal server error",
    };
  }
}

/**
 * Process Stripe refund
 */
async function processStripeRefund(
  paymentIntentId: string,
  amount: number
): Promise<{
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}> {
  try {
    // Dynamically import Stripe only if needed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2023-08-16",
    });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100), // Convert to cents
    });

    return {
      success: true,
      refundId: refund.id,
      amount: (refund.amount || 0) / 100, // Convert back to currency
    };
  } catch (error: any) {
    console.error("Stripe refund error:", error);
    return {
      success: false,
      error: error.message || "Stripe refund failed",
    };
  }
}

/**
 * Process Razorpay refund
 */
async function processRazorpayRefund(
  paymentId: string,
  amount: number
): Promise<{
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}> {
  try {
    // Dynamically import Razorpay only if needed
    const Razorpay = (await import("razorpay")).default;
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });

    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // Convert to paise
    });

    return {
      success: true,
      refundId: refund.id,
      amount: (refund.amount || 0) / 100, // Convert back to currency
    };
  } catch (error: any) {
    console.error("Razorpay refund error:", error);
    return {
      success: false,
      error: error.message || "Razorpay refund failed",
    };
  }
}

/**
 * Get cancellation reasons with labels
 */
export function getCancellationReasons(): Array<{
  value: CancellationReason;
  label: string;
}> {
  return [
    { value: "out_of_stock", label: "Product Out of Stock" },
    { value: "customer_request", label: "Customer Requested Cancellation" },
    { value: "pricing_error", label: "Pricing Error" },
    { value: "address_issue", label: "Delivery Address Issue" },
    { value: "duplicate_order", label: "Duplicate Order" },
    { value: "other", label: "Other Reason" },
  ];
}
