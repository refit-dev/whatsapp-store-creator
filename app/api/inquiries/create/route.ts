import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      productId,
      customerName,
      customerPhone,
      customerEmail,
      message,
      preferredContactTime,
      budgetMin,
      budgetMax,
    } = body;

    // Validate required fields
    if (!storeId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Store ID, customer name, and phone are required" },
        { status: 400 },
      );
    }

    // Use service role to insert inquiries (bypasses RLS for anonymous users)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get store details for WhatsApp notification
    const { data: store, error: storeError } = await (
      supabase.from("stores") as any
    )
      .select("id, name, whatsapp_e164, owner_id")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Get product details if provided
    let product: any = null;
    if (productId) {
      const { data: productData } = await (supabase.from("products") as any)
        .select("id, title, price_cents, currency")
        .eq("id", productId)
        .single();
      product = productData;
    }

    // Insert inquiry
    const { data: inquiry, error: inquiryError } = await (
      supabase.from("inquiries") as any
    )
      .insert({
        store_id: storeId,
        product_id: productId || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        message: message || null,
        preferred_contact_time: preferredContactTime || null,
        budget_min: budgetMin || null,
        budget_max: budgetMax || null,
        status: "new" as const,
        priority: "medium" as const,
      })
      .select()
      .single();

    if (inquiryError) {
      console.error("Error creating inquiry:", inquiryError);
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 },
      );
    }

    // Send WhatsApp notification to store owner
    try {
      const whatsappMessage =
        `🔔 *New Inquiry Received!*\n\n` +
        `📦 Product: ${product?.title || "General Inquiry"}\n` +
        `👤 Customer: ${customerName}\n` +
        `📱 Phone: ${customerPhone}\n` +
        (customerEmail ? `📧 Email: ${customerEmail}\n` : "") +
        (budgetMin || budgetMax
          ? `💰 Budget: ${budgetMin || "?"} - ${budgetMax || "?"}\n`
          : "") +
        (preferredContactTime
          ? `⏰ Contact Time: ${preferredContactTime}\n`
          : "") +
        (message ? `💬 Message: ${message}\n` : "") +
        `\n🔗 View all inquiries: ${
          process.env.NEXT_PUBLIC_APP_URL ||
          process.env.APP_URL ||
          "https://example.com"
        }/dashboard/inquiries`;

      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: store.whatsapp_e164,
          message: whatsappMessage,
        }),
      });
    } catch (whatsappError) {
      console.error("Failed to send WhatsApp notification:", whatsappError);
      // Don't fail the inquiry creation if WhatsApp fails
    }

    return NextResponse.json(
      {
        success: true,
        inquiry,
        message: "Inquiry submitted successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error in inquiry creation:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
