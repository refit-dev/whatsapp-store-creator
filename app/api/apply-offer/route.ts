import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const { offerCode } = await request.json();

    if (!offerCode) {
      return NextResponse.json(
        { error: "Offer code is required" },
        { status: 400 }
      );
    }

    // Call the database function to apply offer
    const { data, error } = await supabase.rpc("apply_special_offer", {
      target_user_id: session.user.id,
      offer_code: offerCode.toUpperCase(),
      applied_by_user_id: session.user.id,
    });

    if (error) {
      console.error("Error applying offer:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Parse the JSONB result
    const result = data as any;

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error in apply-offer API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's available offers
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active offers applicable to the user
    const { data: offers, error } = await supabase
      .from("special_offers")
      .select("*")
      .eq("is_active", true)
      .or(`applicable_to.cs.{all},target_user_ids.cs.{${session.user.id}}`)
      .lte("starts_at", new Date().toISOString())
      .or("ends_at.is.null,ends_at.gte." + new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching offers:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check which offers the user has already redeemed
    const { data: redemptions } = await supabase
      .from("offer_redemptions")
      .select("offer_id, status")
      .eq("user_id", session.user.id);

    const redeemedOfferIds = new Set(redemptions?.map((r) => r.offer_id) || []);

    // Filter out already redeemed offers (if max_uses_per_user is reached)
    const availableOffers =
      offers?.filter((offer) => !redeemedOfferIds.has(offer.id)) || [];

    return NextResponse.json({ offers: availableOffers });
  } catch (error: any) {
    console.error("Error in apply-offer GET API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
