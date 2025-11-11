import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { storeId, targetCents } = await request.json();

    if (!storeId || typeof targetCents !== "number") {
      return NextResponse.json(
        { error: "Store ID and target amount are required" },
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

    // Update the monthly target
    const { error: updateError } = await supabase
      .from("stores")
      .update({ monthly_target_cents: targetCents })
      .eq("id", storeId);

    if (updateError) {
      console.error("Error updating target:", updateError);
      return NextResponse.json(
        { error: "Failed to update target" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in update-target API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
