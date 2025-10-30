import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { toLocaleString } from "@/lib/currency";
import { CopyOrderButton } from "@/components/CopyOrderButton";
import { OrdersManagement } from "@/components/OrdersManagement";

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-gray-600 mt-1">
                Track and manage customer orders
              </p>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* New Orders Management */}
        <div className="mb-6">
          <OrdersManagement storeId={store.id} />
        </div>

        {/* Legacy Orders Table (for compatibility) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Legacy Orders (WhatsApp Only)
          </h3>

          {/* Orders List */}
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No Legacy Orders
              </h2>
              <p className="text-gray-600 mb-6">
                All new orders will appear in the Orders Management section
                above.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Order Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Items
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-gray-900">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">
                            {order.buyer_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.buyer_phone}
                          </p>
                          {order.buyer_address && (
                            <p className="text-sm text-gray-600">
                              {order.buyer_address}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1">
                              {order.items.slice(0, 2).map((item, idx) => (
                                <p key={idx} className="text-sm text-gray-900">
                                  {item.qty}x {item.title}
                                </p>
                              ))}
                              {order.items.length > 2 && (
                                <p className="text-sm text-gray-600">
                                  +{order.items.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">No items</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-lg text-gray-900">
                            {toLocaleString(
                              order.total_cents || 0,
                              store.currency || "USD"
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : order.status === "opened_whatsapp"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <CopyOrderButton
                            order={order}
                            currency={store.currency || "USD"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
