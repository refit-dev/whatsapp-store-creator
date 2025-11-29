import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { OrdersClient } from "./OrdersClient";

// Force no caching for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Get user's store
  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .limit(1);

  const store = stores?.[0];

  if (!store) {
    redirect("/dashboard");
  }

  // Get store's orders
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardWrapper>
      <OrdersClient
        orders={orders || []}
        currency={store.currency || "USD"}
        storeId={store.id}
        storeName={store.name}
        monthlyTargetCents={store.monthly_target_cents || 0}
      />
    </DashboardWrapper>
  );
}

