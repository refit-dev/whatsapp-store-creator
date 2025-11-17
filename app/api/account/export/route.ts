import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import {
  handleCorsPreflightRequest,
  setCorsHeaders,
  validateCorsOrigin,
} from "@/lib/cors";

export const dynamic = "force-dynamic";

/**
 * GDPR Data Export API
 * Allows users to export all their personal data
 */
export async function GET(request: NextRequest) {
  // CORS validation
  if (!validateCorsOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data
    const [
      { data: stores },
      { data: products },
      { data: orders },
      { data: whatsappVerifications },
      { data: subscriptions },
    ] = await Promise.all([
      supabase.from("stores").select("*").eq("user_id", user.id),
      supabase.from("products").select("*").eq("user_id", user.id),
      supabase.from("orders").select("*").eq("store_user_id", user.id),
      supabase
        .from("whatsapp_verifications")
        .select("*")
        .eq("user_id", user.id),
      supabase.from("subscriptions").select("*").eq("user_id", user.id),
    ]);

    // Compile complete user data export
    const exportData = {
      export_date: new Date().toISOString(),
      export_type: "GDPR_Data_Export",
      user_information: {
        user_id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        email_verified: user.email_confirmed_at ? true : false,
      },
      stores: stores || [],
      products: products || [],
      orders: orders || [],
      whatsapp_verifications: whatsappVerifications || [],
      subscriptions: subscriptions || [],
      statistics: {
        total_stores: stores?.length || 0,
        total_products: products?.length || 0,
        total_orders: orders?.length || 0,
        total_verifications: whatsappVerifications?.length || 0,
        total_subscriptions: subscriptions?.length || 0,
      },
      gdpr_notice: {
        right_to_access: "You have received a copy of all your personal data.",
        right_to_rectification:
          "You can update your data through your dashboard settings.",
        right_to_erasure:
          "You can delete your account and all data through Dashboard > Store Settings > Account > Delete My Account.",
        right_to_data_portability:
          "This export is in JSON format for easy transfer to another service.",
        right_to_object:
          "You can object to data processing by contacting hello@watzy.app.",
      },
    };

    // Create downloadable JSON file
    const filename = `watzy-data-export-${user.id}-${Date.now()}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json(
      { error: "Failed to export data. Please try again later." },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  // validateCorsOrigin returns error response or null (success)
  const corsError = validateCorsOrigin(request);
  if (corsError) {
    return corsError;
  }

  const response = new NextResponse(null, { status: 200 });

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}
