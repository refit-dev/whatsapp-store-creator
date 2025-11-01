import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createServerClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a service role client for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Missing Supabase configuration for admin operations" },
        { status: 500 }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Try to create the bucket with admin privileges
    const { data: bucket, error: bucketError } =
      await adminSupabase.storage.createBucket("store-images", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ],
      });

    if (bucketError) {
      // If bucket already exists, that's fine
      if (bucketError.message?.includes("already exists")) {
        return NextResponse.json({
          success: true,
          message: "Storage bucket already exists and is ready to use",
        });
      }

      console.error("Error creating bucket:", bucketError);
      return NextResponse.json(
        {
          error: `Failed to create storage bucket: ${bucketError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Storage bucket created successfully",
      bucket: bucket,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to setup storage",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServerClient();

    // Try to check if bucket exists by attempting to access it
    let bucketExists = false;
    let buckets: string[] = [];

    // First try to list buckets
    const { data: bucketList, error: listError } =
      await supabase.storage.listBuckets();

    if (!listError && bucketList) {
      buckets = bucketList.map((b) => b.name);
      bucketExists = bucketList.some(
        (bucket) => bucket.name === "store-images"
      );
    }

    // If listing failed or bucket not found, try direct access to the bucket
    if (!bucketExists) {
      const { data: files, error: filesError } = await supabase.storage
        .from("store-images")
        .list("", { limit: 1 });

      // If we can list files (even if empty), the bucket exists
      if (!filesError) {
        bucketExists = true;
        if (!buckets.includes("store-images")) {
          buckets.push("store-images");
        }
      }
    }

    return NextResponse.json({
      bucketExists,
      buckets,
      message: bucketExists ? "Storage is ready" : "Storage needs setup",
      note:
        bucketExists && !bucketList
          ? "Bucket exists but not visible in listing (normal for RLS)"
          : undefined,
    });
  } catch (error) {
    console.error("Check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check storage status",
      },
      { status: 500 }
    );
  }
}
