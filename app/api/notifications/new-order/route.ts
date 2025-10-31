import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { storeId, orderId, customerName, total } = await request.json();

    // Get store details including owner's phone
    const supabase = supabaseServer();
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("name, owner_id, whatsapp_e164")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      console.error("Store not found:", storeError);
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // For now, just log the notification
    // In a real implementation, you would integrate with WhatsApp Business API
    console.log("New order notification:", {
      storeName: store.name,
      orderId,
      customerName,
      total,
      storeOwnerPhone: store.whatsapp_e164,
    });

    // You could also save notifications to database for tracking
    await supabase.from("notifications").insert({
      store_id: storeId,
      type: "new_order",
      title: "New Order Received",
      message: `New order from ${customerName} for ₹${total}`,
      data: { orderId, customerName, total },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
