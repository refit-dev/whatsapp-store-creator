import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import { DevImageService } from "@/lib/dev-image-service";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate unique filename with folder based on image type
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();

    // Determine folder based on form data or default to products
    const imageType = (formData.get("type") as string) || "products";
    const folder =
      imageType === "logo"
        ? "store-logos"
        : imageType === "banner"
        ? "store-banners"
        : "products";

    const filename = `${folder}/${user.id}_${timestamp}.${fileExtension}`;

    try {
      // Check if we're in development mode and should use mock service
      const isDevelopment = process.env.NODE_ENV === "development";
      const useMockService = process.env.USE_MOCK_IMAGES === "true";

      if (useMockService) {
        console.log("Using mock image service (USE_MOCK_IMAGES=true)");
        const result = await DevImageService.mockUpload(file, imageType);
        return NextResponse.json(result);
      }

      console.log("Attempting to upload to Supabase Storage...");

      // Convert file to buffer
      const fileBuffer = await file.arrayBuffer();

      console.log(`Uploading file: ${filename}`);

      // Use service role for uploads to bypass RLS policies
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json(
          {
            error: `Missing Supabase configuration for uploads. Please check environment variables.`,
          },
          { status: 500 }
        );
      }

      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Try to upload using service role (bypasses RLS)
      let uploadResult = await adminSupabase.storage
        .from("store-images")
        .upload(filename, fileBuffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      // If upload fails because bucket doesn't exist, try to create it
      if (uploadResult.error) {
        console.log("Upload failed, checking if bucket needs to be created...");
        console.log("Upload error:", uploadResult.error);

        // Check if the error is because bucket doesn't exist
        if (
          uploadResult.error.message?.includes("bucket") ||
          uploadResult.error.message?.includes("not found")
        ) {
          console.log(
            "Attempting to create storage bucket with admin privileges..."
          );

          // Create the bucket using the same admin client
          const { error: bucketError } =
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

          if (bucketError && !bucketError.message?.includes("already exists")) {
            console.error("Error creating bucket:", bucketError);
            return NextResponse.json(
              {
                error: `Storage bucket setup failed: ${bucketError.message}. Please visit /debug-storage to set up storage.`,
              },
              { status: 500 }
            );
          }

          console.log(
            "Storage bucket created or already exists, retrying upload..."
          );

          // Retry the upload after creating the bucket (using admin client)
          uploadResult = await adminSupabase.storage
            .from("store-images")
            .upload(filename, fileBuffer, {
              contentType: file.type,
              cacheControl: "3600",
              upsert: false,
            });
        }
      }

      // Check final upload result
      if (uploadResult.error) {
        console.error("Final upload error:", uploadResult.error);
        return NextResponse.json(
          { error: `Failed to upload file: ${uploadResult.error.message}` },
          { status: 500 }
        );
      }

      console.log("File uploaded successfully, getting public URL...");

      // Get public URL using admin client
      const { data: urlData } = adminSupabase.storage
        .from("store-images")
        .getPublicUrl(filename);

      console.log(`Public URL: ${urlData.publicUrl}`);

      return NextResponse.json({
        url: urlData.publicUrl,
        filename: filename,
        size: file.size,
        contentType: file.type,
      });
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Upload endpoint. Use POST with file." });
}
