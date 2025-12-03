import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getBackofficeProfile } from "@/lib/backoffice";

// This API has been updated to handle blocking/unblocking stores
// instead of approving/rejecting (stores are now auto-approved)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, action, blockReason } = body;

    if (!storeId || !action) {
      return NextResponse.json(
        { error: "Store ID and action are required" },
        { status: 400 }
      );
    }

    if (!["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'block' or 'unblock'" },
        { status: 400 }
      );
    }

    if (action === "block" && !blockReason?.trim()) {
      return NextResponse.json(
        { error: "Block reason is required" },
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

    const backofficeProfile = await getBackofficeProfile(supabase, user.id);

    if (!backofficeProfile) {
      return NextResponse.json(
        { error: "Admin or approver access required" },
        { status: 403 }
      );
    }

    // Update store moderation status
    const updateData: {
      is_blocked: boolean;
      block_reason?: string | null;
      blocked_at?: string | null;
      blocked_by?: string | null;
    } = {
      is_blocked: action === "block",
      blocked_at: action === "block" ? new Date().toISOString() : null,
      blocked_by: action === "block" ? user.id : null,
    };

    if (action === "block") {
      updateData.block_reason = blockReason;
    } else {
      updateData.block_reason = null;
    }

    const { error: updateError } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", storeId);

    if (updateError) {
      console.error("Error updating store:", updateError);
      return NextResponse.json(
        { error: "Failed to update store status" },
        { status: 500 }
      );
    }

    // TODO: Send email notification to store owner
    // You can implement this using Resend or another email service

    return NextResponse.json({
      success: true,
      message: `Store ${
        action === "block" ? "blocked" : "unblocked"
      } successfully`,
    });
  } catch (error) {
    console.error("Error in approve-store API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
