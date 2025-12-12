import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

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

    const { orderId, storeId, status, isPaid } = await request.json();

    if (!orderId || !storeId) {
      return NextResponse.json(
        { error: "Missing orderId or storeId" },
        { status: 400 }
      );
    }

    // Verify the order belongs to a store owned by the user
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, owner_id")
      .eq("id", storeId)
      .eq("owner_id", user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found or unauthorized" },
        { status: 403 }
      );
    }

    // Verify the order belongs to the store
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("id, store_id, status")
      .eq("id", orderId)
      .eq("store_id", storeId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Build the update object
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    // If isPaid is explicitly set to true, set status to 'paid'
    // If isPaid is false, only change status if it was 'paid'
    if (isPaid === true) {
      updateData.status = "paid";
    } else if (isPaid === false && order.status === "paid") {
      // If unchecking paid, revert to a pending status
      updateData.status = status || "opened_whatsapp";
    }

    // Update the order
    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .eq("store_id", storeId);

    if (updateError) {
      console.error("Error updating order status:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Error in update-status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
