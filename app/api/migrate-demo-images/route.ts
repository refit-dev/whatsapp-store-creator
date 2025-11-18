import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Demo products with Unsplash images
const DEMO_PRODUCTS = [
  {
    title: "Blueberry Muffin",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=800&q=80",
    ],
  },
  {
    title: "Bagel with Cream Cheese",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=800&q=80",
    ],
  },
  {
    title: "Red Velvet Cake Slice",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&q=80",
    ],
  },
  {
    title: "Chocolate Croissant",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1623334044303-241021148842?w=800&q=80",
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80",
    ],
  },
  {
    title: "Apple Pie",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=800&q=80",
    ],
  },
  {
    title: "Sourdough Bread",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=800&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80",
    ],
  },
];

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing Supabase credentials" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get demo-bakery store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("handle", "demo-bakery")
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Demo store not found", details: storeError },
        { status: 404 }
      );
    }

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });

    if (productsError || !products) {
      return NextResponse.json(
        { error: "Failed to fetch products", details: productsError },
        { status: 500 }
      );
    }

    const results = [];

    // Upload store logo
    try {
      const logoUrl =
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80";
      const logoResponse = await fetch(logoUrl);
      const logoBlob = await logoResponse.blob();
      const logoBuffer = Buffer.from(await logoBlob.arrayBuffer());

      const { data: logoUpload } = await supabase.storage
        .from("store-images")
        .upload(`demo-store/logo.jpg`, logoBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (logoUpload) {
        const { data: logoUrlData } = supabase.storage
          .from("store-images")
          .getPublicUrl("demo-store/logo.jpg");

        await supabase
          .from("stores")
          .update({ logo_url: logoUrlData.publicUrl })
          .eq("id", store.id);

        results.push({
          item: "Store Logo",
          status: "success",
          url: logoUrlData.publicUrl,
        });
      }
    } catch (error: any) {
      results.push({
        item: "Store Logo",
        status: "error",
        error: error.message,
      });
    }

    // Upload store banner
    try {
      const bannerUrl =
        "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&q=80";
      const bannerResponse = await fetch(bannerUrl);
      const bannerBlob = await bannerResponse.blob();
      const bannerBuffer = Buffer.from(await bannerBlob.arrayBuffer());

      const { data: bannerUpload } = await supabase.storage
        .from("store-images")
        .upload(`demo-store/banner.jpg`, bannerBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: true,
        });

      if (bannerUpload) {
        const { data: bannerUrlData } = supabase.storage
          .from("store-images")
          .getPublicUrl("demo-store/banner.jpg");

        await supabase
          .from("stores")
          .update({ banner_url: bannerUrlData.publicUrl })
          .eq("id", store.id);

        results.push({
          item: "Store Banner",
          status: "success",
          url: bannerUrlData.publicUrl,
        });
      }
    } catch (error: any) {
      results.push({
        item: "Store Banner",
        status: "error",
        error: error.message,
      });
    }

    // Upload product images
    for (const product of products) {
      const demoProduct = DEMO_PRODUCTS.find((p) => p.title === product.title);
      if (!demoProduct) {
        results.push({
          product: product.title,
          status: "skipped",
          reason: "No demo data",
        });
        continue;
      }

      const newImageUrls: string[] = [];

      for (let i = 0; i < demoProduct.unsplashUrls.length; i++) {
        const unsplashUrl = demoProduct.unsplashUrls[i];

        try {
          // Download image from Unsplash
          const imageResponse = await fetch(unsplashUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to download: ${imageResponse.statusText}`);
          }

          const imageBlob = await imageResponse.blob();
          const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

          // Upload to Supabase
          const filename = `${product.id}_${i + 1}.jpg`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("store-images")
              .upload(`demo-products/${filename}`, imageBuffer, {
                contentType: "image/jpeg",
                cacheControl: "3600",
                upsert: true,
              });

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from("store-images")
            .getPublicUrl(`demo-products/${filename}`);

          newImageUrls.push(urlData.publicUrl);
        } catch (error: any) {
          results.push({
            product: product.title,
            image: i + 1,
            status: "error",
            error: error.message,
          });
        }
      }

      if (newImageUrls.length > 0) {
        // Update product with new image URLs
        const { error: updateError } = await supabase
          .from("products")
          .update({ image_urls: newImageUrls })
          .eq("id", product.id);

        if (updateError) {
          results.push({
            product: product.title,
            status: "error",
            error: updateError.message,
          });
        } else {
          results.push({
            product: product.title,
            status: "success",
            images: newImageUrls.length,
            urls: newImageUrls,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Demo store images migrated to Supabase",
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    );
  }
}
