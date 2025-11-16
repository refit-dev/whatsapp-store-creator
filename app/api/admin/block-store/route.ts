import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, blockReason } = body;

    if (!storeId || !blockReason?.trim()) {
      return NextResponse.json(
        { error: "Store ID and block reason are required" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });

    // Check if user is admin
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

    const { data: adminData } = await supabase
      .from("admins")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Block the store
    const { error: blockError } = await supabase
      .from("stores")
      .update({
        is_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_by: user.id,
        block_reason: blockReason.trim(),
      })
      .eq("id", storeId);

    if (blockError) {
      console.error("Error blocking store:", blockError);
      return NextResponse.json(
        { error: "Failed to block store" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to store owner

    return NextResponse.json({
      success: true,
      message: "Store blocked successfully",
    });
  } catch (error) {
    console.error("Error in block-store API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
