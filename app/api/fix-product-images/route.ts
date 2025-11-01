import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = supabaseServer();

  try {
    // Get the demo-bakery store ID
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("handle", "demo-bakery")
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Update the two products with broken image URLs
    // 1. Update Sourdough Loaf with icon-192.png
    const { error: sourdoughError } = await supabase
      .from("products")
      .update({
        image_urls: [
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
        ],
      })
      .eq("store_id", store.id)
      .eq("title", "Sourdough Loaf")
      .contains("image_urls", ["/icons/icon-192.png"]);

    // 2. Update Chocolate Croissant with icon-192.png
    const { error: croissantError } = await supabase
      .from("products")
      .update({
        image_urls: [
          "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=80",
        ],
      })
      .eq("store_id", store.id)
      .eq("title", "Chocolate Croissant")
      .contains("image_urls", ["/icons/icon-192.png"]);

    if (sourdoughError) {
      console.error("Error updating Sourdough Loaf:", sourdoughError);
    }

    if (croissantError) {
      console.error("Error updating Chocolate Croissant:", croissantError);
    }

    return NextResponse.json({
      success: true,
      message: "Fixed broken product images",
      sourdoughUpdated: !sourdoughError,
      croissantUpdated: !croissantError,
    });
  } catch (error) {
    console.error("Error fixing product images:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
