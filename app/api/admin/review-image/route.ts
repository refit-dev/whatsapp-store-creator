import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reviewId, action, flagReason } = body;

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Review ID and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "flag"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'flag'" },
        { status: 400 }
      );
    }

    if (action === "flag" && !flagReason?.trim()) {
      return NextResponse.json(
        { error: "Flag reason is required" },
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

    // Update image review
    const updateData: {
      review_status: "approved" | "flagged";
      reviewed_by: string;
      reviewed_at: string;
      flag_reason?: string;
    } = {
      review_status: action === "approve" ? "approved" : "flagged",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (action === "flag") {
      updateData.flag_reason = flagReason;
    }

    const { error: updateError } = await supabase
      .from("image_reviews")
      .update(updateData)
      .eq("id", reviewId);

    if (updateError) {
      console.error("Error updating image review:", updateError);
      return NextResponse.json(
        { error: "Failed to update image review" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Image ${
        action === "approve" ? "approved" : "flagged"
      } successfully`,
    });
  } catch (error) {
    console.error("Error in review-image API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
