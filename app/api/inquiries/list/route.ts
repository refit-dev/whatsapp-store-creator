import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const storeId = searchParams.get("storeId");

    // Build query
    let query = supabase
      .from("inquiries")
      .select(
        `
        *,
        stores!inner(id, name, owner_id),
        products(id, title, price_cents, currency, image_urls)
      `
      )
      .order("created_at", { ascending: false });

    // Filter by store ownership (only show inquiries for user's stores)
    query = query.eq("stores.owner_id", user.id);

    // Apply optional filters
    if (status) {
      query = query.eq("status", status);
    }
    if (priority) {
      query = query.eq("priority", priority);
    }
    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { data: inquiries, error } = await query;

    if (error) {
      console.error("Error fetching inquiries:", error);
      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      );
    }

    return NextResponse.json({ inquiries }, { status: 200 });
  } catch (error: any) {
    console.error("Error in inquiry list:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
