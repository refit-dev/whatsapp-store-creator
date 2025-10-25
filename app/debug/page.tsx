"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function DebugPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const sb = supabaseBrowser();

      // Get products
      const { data: productsData } = await sb
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      // Get ALL orders to see the problematic ones
      const { data: ordersData } = await sb
        .from("orders")
        .select("*, stores(handle, name)")
        .order("created_at", { ascending: false });

      // Get stores
      const { data: storesData } = await sb
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      // Get user info and their store's orders (like dashboard does)
      const {
        data: { user },
      } = await sb.auth.getUser();
      let userOrdersData = [];
      if (user) {
        const { data: userStore } = await sb
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .limit(1);

        if (userStore?.[0]) {
          const { data: userStoreOrders } = await sb
            .from("orders")
            .select("*")
            .eq("store_id", userStore[0].id)
            .order("created_at", { ascending: false });
          userOrdersData = userStoreOrders || [];
        }
      }

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setStores(storesData || []);
      setUserOrders(userOrdersData);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug: Products & Orders</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stores */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Stores</h2>
          <div className="space-y-3">
            {stores.map((store) => (
              <div
                key={store.id}
                className="bg-white p-4 rounded-lg shadow border"
              >
                <h3 className="font-medium">{store.name}</h3>
                <p className="text-sm text-gray-600">Handle: {store.handle}</p>
                <p className="text-sm text-gray-600">Owner: {store.owner_id}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(store.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* User's Store Orders (Dashboard View) */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Dashboard Orders (Your Store)
          </h2>
          <div className="space-y-3">
            {userOrders.map((order) => (
              <div
                key={order.id}
                className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200"
              >
                <h3 className="font-medium">{order.buyer_name}</h3>
                <p className="text-sm text-red-600 font-bold">
                  Total (cents): {order.total_cents}
                </p>
                <p className="text-sm text-red-600 font-bold">
                  Total (display): ₹{(order.total_cents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Status: {order.status}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* All Orders */}
        <div>
          <h2 className="text-xl font-semibold mb-4">All Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-4 rounded-lg shadow border"
              >
                <h3 className="font-medium">{order.buyer_name}</h3>
                <p className="text-sm text-gray-600">
                  Store: {order.stores?.name || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">
                  Total (cents): {order.total_cents}
                </p>
                <p className="text-sm text-gray-600">
                  Total (display): ₹{(order.total_cents / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Status: {order.status}</p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
