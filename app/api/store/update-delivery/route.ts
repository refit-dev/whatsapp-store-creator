import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { sanitizeJSON } from "@/lib/sanitize";
import {
  handleCorsPreflightRequest,
  setCorsHeaders,
  validateCorsOrigin,
} from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  const response = handleCorsPreflightRequest(request);
  return response || new NextResponse(null, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    // Validate CORS origin
    const corsError = validateCorsOrigin(request);
    if (corsError) {
      return corsError;
    }

    const { storeId, deliveryEnabled, deliveryType, deliverySlots } =
      await request.json();

    // Sanitize delivery slots JSON to prevent script injection
    const sanitizedDeliverySlots = deliverySlots
      ? sanitizeJSON(JSON.stringify(deliverySlots), null)
      : null;

    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the store belongs to the user
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("owner_id")
      .eq("id", storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (store.owner_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to update this store" },
        { status: 403 }
      );
    }

    // Update delivery settings with sanitized data
    const { error: updateError } = await supabase
      .from("stores")
      .update({
        delivery_enabled: deliveryEnabled,
        delivery_type: deliveryType,
        delivery_slots: sanitizedDeliverySlots,
      })
      .eq("id", storeId);

    if (updateError) {
      console.error("Error updating delivery settings:", updateError);
      const response = NextResponse.json(
        { error: "Failed to update delivery settings" },
        { status: 500 }
      );
      return setCorsHeaders(response, request.headers.get("origin"));
    }

    const response = NextResponse.json({ success: true });
    return setCorsHeaders(response, request.headers.get("origin"));
  } catch (error) {
    console.error("Error in update-delivery API:", error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
    return setCorsHeaders(response, request.headers.get("origin"));
  }
}
