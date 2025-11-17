import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import { DevImageService } from "@/lib/dev-image-service";
import { createClient } from "@supabase/supabase-js";
import { validateFile, validateFileBuffer } from "@/lib/file-validation";
import { scanFile } from "@/lib/virus-scanner";

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

    // Validate file type, size, and extension
    const clientValidation = validateFile(file);
    if (!clientValidation.valid) {
      return NextResponse.json(
        { error: clientValidation.error },
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
      const buffer = Buffer.from(fileBuffer);

      // Server-side validation: Check file content (magic bytes)
      const serverValidation = await validateFileBuffer(
        buffer,
        file.name,
        file.type
      );

      if (!serverValidation.valid) {
        return NextResponse.json(
          { error: serverValidation.error },
          { status: 400 }
        );
      }

      // Virus/malware scanning
      console.log("Scanning file for viruses/malware...");
      const scanResult = await scanFile(buffer);

      if (scanResult.infected) {
        console.warn("⚠️ Infected file detected:", scanResult);

        // Log the scan result to database for admin review
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceKey) {
            const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
            await adminSupabase.from("virus_scans").insert({
              user_id: user.id,
              filename: file.name,
              file_size: file.size,
              mime_type: file.type,
              scanner: scanResult.scanner,
              infected: true,
              threats: scanResult.threats,
              scan_time_ms: scanResult.scanTime,
            });
          }
        } catch (logError) {
          console.error("Failed to log virus scan:", logError);
        }

        return NextResponse.json(
          {
            error: `File rejected: Security scan detected threats - ${scanResult.threats?.join(
              ", "
            )}. Please ensure you're uploading a clean image file.`,
          },
          { status: 400 }
        );
      }

      // Log clean scan result (optional, for audit trail)
      if (process.env.LOG_ALL_SCANS === "true") {
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceKey) {
            const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
            await adminSupabase.from("virus_scans").insert({
              user_id: user.id,
              filename: file.name,
              file_size: file.size,
              mime_type: file.type,
              scanner: scanResult.scanner,
              infected: false,
              threats: null,
              scan_time_ms: scanResult.scanTime,
            });
          }
        } catch (logError) {
          console.error("Failed to log clean scan:", logError);
        }
      }

      console.log(
        `✓ File passed security scan (${scanResult.scanner}, ${scanResult.scanTime}ms)`
      );
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
        .upload(filename, buffer, {
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
                "image/jpg",
                "image/png",
                "image/webp",
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
            .upload(filename, buffer, {
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
