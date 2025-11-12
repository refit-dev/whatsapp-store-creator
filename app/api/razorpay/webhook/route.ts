import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const orderId = body.payload.payment.entity.receipt;

    const supabase = createServerClient(true); // Use service role

    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();

    if (order && order.status !== "paid") {
      // Update order status
      // Note: Inventory is already reduced when order is created
      await supabase
        .from("orders")
        .update({
          status: "paid",
        } as Database["public"]["Tables"]["orders"]["Update"])
        .eq("id", orderId);

      console.log("✅ Order marked as paid:", orderId);
    }

    // Check if this is a subscription payment event
    const event = body.event;
    if (
      event === "subscription.charged" ||
      event === "subscription.authenticated"
    ) {
      const subscriptionEntity = body.payload.subscription?.entity;
      const paymentEntity = body.payload.payment?.entity;

      if (subscriptionEntity && paymentEntity) {
        const userId = subscriptionEntity.notes?.user_id;

        if (userId) {
          // Process referral reward if user was referred
          const { data: rewardProcessed, error: rewardError } =
            await supabase.rpc("process_referral_reward", {
              referred_user_uuid: userId,
            });

          if (rewardError) {
            console.error("Error processing referral reward:", rewardError);
          } else if (rewardProcessed) {
            console.log("✅ Referral reward granted for user:", userId);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
