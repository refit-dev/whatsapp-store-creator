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

    // Delete existing products
    await supabase.from("products").delete().eq("store_id", store.id);

    // Insert new products with proper images
    const products = [
      {
        store_id: store.id,
        title: "Sourdough Loaf",
        description:
          "Crusty, slow-fermented classic sourdough bread. Perfect for sandwiches or toasting.",
        price_cents: 2499,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 25,
      },
      {
        store_id: store.id,
        title: "Chocolate Croissant",
        description:
          "Flaky buttery pastry filled with rich dark chocolate. A French classic.",
        price_cents: 1499,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 50,
      },
      {
        store_id: store.id,
        title: "Apple Pie",
        description:
          "Classic homemade apple pie with cinnamon and flaky crust. Served warm.",
        price_cents: 4500,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 12,
      },
      {
        store_id: store.id,
        title: "Bagel with Cream Cheese",
        description:
          "Fresh baked everything bagel served with rich cream cheese spread.",
        price_cents: 899,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 30,
      },
      {
        store_id: store.id,
        title: "Sourdough Bread",
        description:
          "Artisan sourdough bread with a crispy crust and soft interior.",
        price_cents: 2299,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 20,
      },
      {
        store_id: store.id,
        title: "Red Velvet Cake Slice",
        description:
          "Moist red velvet cake with cream cheese frosting. Rich and decadent.",
        price_cents: 3500,
        currency: "INR",
        image_urls: [
          "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80",
        ],
        variants: [],
        is_active: true,
        stock_qty: 15,
      },
    ];

    const { error: insertError } = await supabase
      .from("products")
      .insert(products);

    if (insertError) {
      console.error("Error inserting products:", insertError);
      return NextResponse.json(
        { error: "Failed to insert products" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${products.length} products for demo-bakery store`,
      products: products.length,
    });
  } catch (error) {
    console.error("Error updating products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
