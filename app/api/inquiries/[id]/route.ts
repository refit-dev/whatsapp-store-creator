import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const {
      status,
      notes,
      followUpDate,
      priority,
      conversionValue,
      lostReason,
    } = body;

    const inquiryId = params.id;

    // Verify ownership
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("*, stores!inner(owner_id)")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (inquiry.stores.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized - not your store" },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "converted") {
        updateData.converted_at = new Date().toISOString();
        if (conversionValue) updateData.conversion_value = conversionValue;
      }
      if (status === "lost" && lostReason) {
        updateData.lost_reason = lostReason;
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (followUpDate !== undefined) updateData.follow_up_date = followUpDate;
    if (priority !== undefined) updateData.priority = priority;

    // Update inquiry
    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiryId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating inquiry:", updateError);
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      );
    }

    // Log interaction if status changed
    if (status && status !== inquiry.status) {
      await supabase.from("inquiry_interactions").insert({
        inquiry_id: inquiryId,
        interaction_type: "status_change",
        previous_status: inquiry.status,
        new_status: status,
        notes: notes || null,
        created_by: user.id,
      });
    }

    return NextResponse.json(
      { success: true, inquiry: updatedInquiry },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in inquiry update:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
