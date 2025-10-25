import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";

// Force no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SimpleOrdersPage() {
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
    return <div className="p-8">No store found</div>;
  }

  // Get orders - EXACT same query as debug page
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Simple Orders Test</h1>

      <div className="mb-4 bg-blue-50 p-4 rounded">
        <p>
          <strong>Store:</strong> {store.name} (ID: {store.id})
        </p>
        <p>
          <strong>Currency:</strong> {store.currency}
        </p>
        <p>
          <strong>Orders Found:</strong> {orders?.length || 0}
        </p>
      </div>

      <div className="space-y-4">
        {orders?.map((order) => (
          <div
            key={order.id}
            className="bg-white border-2 border-red-500 p-6 rounded-lg"
          >
            <h3 className="text-xl font-bold mb-2">{order.buyer_name}</h3>

            {/* Raw Values */}
            <div className="bg-yellow-100 p-3 rounded mb-3">
              <p className="font-mono">
                <strong>RAW total_cents:</strong> {order.total_cents}
              </p>
              <p className="font-mono">
                <strong>RAW subtotal_cents:</strong> {order.subtotal_cents}
              </p>
            </div>

            {/* Manual Calculations */}
            <div className="bg-green-100 p-3 rounded mb-3">
              <p>
                <strong>Manual calc:</strong> {order.total_cents} ÷ 100 ={" "}
                {(order.total_cents || 0) / 100}
              </p>
              <p>
                <strong>Manual display:</strong> ₹
                {((order.total_cents || 0) / 100).toFixed(2)}
              </p>
            </div>

            {/* Using toLocaleString */}
            <div className="bg-purple-100 p-3 rounded mb-3">
              <p>
                <strong>toLocaleString result:</strong>{" "}
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format((order.total_cents || 0) / 100)}
              </p>
            </div>

            {/* Order Details */}
            <div className="text-sm text-gray-600">
              <p>Phone: {order.buyer_phone}</p>
              <p>Address: {order.buyer_address}</p>
              <p>Status: {order.status}</p>
              <p>Created: {order.created_at}</p>
              <p>Order ID: {order.id}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
