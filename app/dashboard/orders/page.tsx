import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { OrderAnalytics } from "@/components/OrderAnalytics";
import { ExportOrders } from "@/components/ExportOrders";
import { AllOrdersTable } from "@/components/AllOrdersTable";
import { LogoutButton } from "@/components/LogoutButton";
import { DashboardWrapper } from "@/components/DashboardWrapper";

// Force no caching for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Order {
  id: string;
  buyer_name: string;
  buyer_phone: string;
  buyer_address: string | null;
  buyer_notes: string | null;
  total_cents: number;
  status: string;
  created_at: string;
  payment_provider: string | null;
  payment_id: string | null;
  items: Array<{
    title: string;
    qty: number;
    priceCents: number;
    productId: string;
  }>;
}

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
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-8 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  📦 Orders & Analytics
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base">
                  Track orders, analyze performance & export reports
                </p>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Link
                  href="/dashboard"
                  className="px-4 md:px-6 py-2 md:py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm md:text-base"
                >
                  ← Dashboard
                </Link>
                <div className="hidden sm:block border-l border-gray-200 pl-2 md:pl-3">
                  <LogoutButton />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics & Export - Unified Section */}
          <div className="mb-4 md:mb-6">
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">
                    📊 Analytics & Reports
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">
                    Track performance and export data
                  </p>
                </div>
                <ExportOrders
                  orders={orders as Order[]}
                  currency={store.currency || "USD"}
                  storeName={store.name}
                />
              </div>

              <OrderAnalytics
                orders={orders as Order[]}
                currency={store.currency || "USD"}
                storeId={store.id}
                monthlyTargetCents={store.monthly_target_cents || 0}
              />
            </div>
          </div>

          {/* All Orders Table with Filter & Refresh */}
          <AllOrdersTable
            initialOrders={orders as Order[]}
            currency={store.currency || "USD"}
            storeId={store.id}
          />
        </div>
      </main>
    </DashboardWrapper>
  );
}
