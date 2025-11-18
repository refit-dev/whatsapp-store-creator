import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo products with Unsplash images to download and re-upload
const demoProducts = [
  {
    title: "Sourdough Loaf",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=80",
    ],
  },
  {
    title: "Croissants",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1623334044303-241021148842?w=500&auto=format&fit=crop&q=80",
    ],
  },
  {
    title: "Baguette",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80",
    ],
  },
  {
    title: "Chocolate Chip Cookies",
    unsplashUrls: [
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80",
    ],
  },
];

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToSupabase(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("store-images")
    .upload(`demo-products/${filename}`, buffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("store-images")
    .getPublicUrl(`demo-products/${filename}`);

  return urlData.publicUrl;
}

async function migrateProductImages() {
  console.log("🚀 Starting demo store image migration...\n");

  // Get demo-bakery store
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("handle", "demo-bakery")
    .single();

  if (!store) {
    console.error("❌ Demo store not found!");
    return;
  }

  console.log(`✅ Found demo store: ${store.id}\n`);

  // Get all products for demo store
  const { data: products } = await supabase
    .from("products")
    .select("id, title, image_urls")
    .eq("store_id", store.id)
    .order("created_at", { ascending: true });

  if (!products || products.length === 0) {
    console.error("❌ No products found for demo store!");
    return;
  }

  console.log(`📦 Found ${products.length} products to migrate\n`);

  for (const product of products) {
    console.log(`\n🔄 Processing: ${product.title}`);

    const demoProduct = demoProducts.find((p) => p.title === product.title);
    if (!demoProduct) {
      console.log(`⚠️  No demo data for "${product.title}", skipping...`);
      continue;
    }

    const newImageUrls: string[] = [];

    for (let i = 0; i < demoProduct.unsplashUrls.length; i++) {
      const unsplashUrl = demoProduct.unsplashUrls[i];
      console.log(`  📥 Downloading image ${i + 1}...`);

      try {
        const buffer = await downloadImage(unsplashUrl);
        console.log(`  ✓ Downloaded ${Math.round(buffer.length / 1024)}KB`);

        const filename = `${product.id}_${i + 1}.jpg`;
        console.log(`  📤 Uploading to Supabase...`);

        const publicUrl = await uploadToSupabase(buffer, filename);
        console.log(`  ✓ Uploaded: ${publicUrl}`);

        newImageUrls.push(publicUrl);
      } catch (error) {
        console.error(`  ❌ Error: ${error}`);
      }
    }

    if (newImageUrls.length > 0) {
      console.log(
        `  💾 Updating product with ${newImageUrls.length} images...`
      );

      const { error: updateError } = await supabase
        .from("products")
        .update({ image_urls: newImageUrls })
        .eq("id", product.id);

      if (updateError) {
        console.error(`  ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`  ✅ Product updated successfully!`);
      }
    }
  }

  console.log("\n\n🎉 Migration complete!");
  console.log("✨ Demo store images are now stored in Supabase!\n");
}

// Run the migration
migrateProductImages().catch(console.error);
