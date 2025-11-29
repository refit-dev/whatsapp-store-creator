import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getBackofficeProfile } from "@/lib/backoffice";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, action, rejectionReason } = body;

    if (!storeId || !action) {
      return NextResponse.json(
        { error: "Store ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && !rejectionReason?.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
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

    // Update store status
    const updateData: {
      approval_status: "approved" | "rejected";
      approved_by: string;
      approved_at: string;
      rejection_reason?: string;
    } = {
      approval_status: action === "approve" ? "approved" : "rejected",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    if (action === "reject") {
      updateData.rejection_reason = rejectionReason;
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
        action === "approve" ? "approved" : "rejected"
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
