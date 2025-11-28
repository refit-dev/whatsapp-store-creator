import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

interface ProductRow {
  "Product Name": string;
  Description?: string;
  Price: string | number;
  "Stock Quantity"?: string | number;
  "Image URL"?: string;
  "Active Status"?: string | boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storeId = formData.get("storeId") as string;
    const currency = formData.get("currency") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the store
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("id", storeId)
      .eq("owner_id", session.user.id)
      .single();

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Store not found or unauthorized" },
        { status: 403 }
      );
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Parse CSV header
    const header = lines[0].split(",").map((h) => h.trim());

    // Expected columns
    const requiredColumns = ["Product Name", "Price"];
    const missingColumns = requiredColumns.filter(
      (col) => !header.includes(col)
    );

    if (missingColumns.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${missingColumns.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Fetch existing product titles for this store to block duplicates
    const { data: existingProducts } = await supabase
      .from("products")
      .select("title")
      .eq("store_id", storeId);

    const existingTitles = new Set(
      (existingProducts || []).map((p: any) => (p.title || "").trim().toLowerCase())
    );

    // Parse data rows
    const products: any[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const values = line.split(",").map((v) => v.trim());
        const row: any = {};

        header.forEach((col, idx) => {
          row[col] = values[idx] || "";
        });

        // Validate required fields
        if (!row["Product Name"]) {
          errors.push({ row: i + 1, error: "Product Name is required" });
          continue;
        }

        if (!row["Price"] || isNaN(parseFloat(row["Price"]))) {
          errors.push({ row: i + 1, error: "Invalid price" });
          continue;
        }

        // Parse active status
        let isActive = true;
        if (row["Active Status"]) {
          const status = row["Active Status"].toLowerCase();
          isActive = status === "true" || status === "yes" || status === "1";
        }

        // Parse image URLs (support comma-separated URLs)
        let imageUrls: string[] = [];
        if (row["Image URL"]) {
          imageUrls = row["Image URL"]
            .split(",")
            .map((url: string) => url.trim())
            .filter((url: string) => url.length > 0);
        }

        // Check for duplicates (case-insensitive) within store
        const normalizedTitle = row["Product Name"].trim().toLowerCase();
        if (existingTitles.has(normalizedTitle)) {
          errors.push({
            row: i + 1,
            error: "Duplicate product name for this store",
          });
          continue;
        }

        // Prepare product data
        const productData = {
          store_id: storeId,
          title: row["Product Name"].trim(),
          description: row["Description"] || null,
          price_cents: Math.round(parseFloat(row["Price"]) * 100),
          currency: currency || "INR",
          stock_qty: row["Stock Quantity"]
            ? parseInt(row["Stock Quantity"])
            : null,
          image_urls: imageUrls,
          is_active: isActive,
        };

        products.push(productData);
        existingTitles.add(normalizedTitle); // prevent duplicates within the file as well
      } catch (error: any) {
        errors.push({ row: i + 1, error: error.message || "Parse error" });
      }
    }

    // Insert products into database
    let successCount = 0;
    let failedCount = errors.length;

    if (products.length > 0) {
      const { data, error: insertError } = await supabase
        .from("products")
        .insert(products)
        .select();

      if (insertError) {
        console.error("Bulk insert error:", insertError);
        return NextResponse.json(
          {
            success: 0,
            failed: products.length + failedCount,
            errors: [
              ...errors,
              {
                row: 0,
                error: `Database error: ${insertError.message}`,
              },
            ],
          },
          { status: 500 }
        );
      }

      successCount = data?.length || 0;
    }

    return NextResponse.json({
      success: successCount,
      failed: failedCount,
      errors: errors,
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}
