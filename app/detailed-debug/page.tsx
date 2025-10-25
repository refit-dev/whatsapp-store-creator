"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { getUser } from "@/lib/auth";

export default function DetailedDebugPage() {
  const [loading, setLoading] = useState(true);
  const [debugData, setDebugData] = useState<any>({});

  useEffect(() => {
    async function fetchAllData() {
      const sb = supabaseBrowser();

      // Get current user
      const {
        data: { user },
      } = await sb.auth.getUser();

      // Get ALL orders (no filtering)
      const { data: allOrders } = await sb
        .from("orders")
        .select("*, stores(handle, name, owner_id)")
        .order("created_at", { ascending: false });

      // Get user's stores
      const { data: userStores } = await sb
        .from("stores")
        .select("*")
        .eq("owner_id", user?.id || "");

      // Get orders using dashboard method
      let dashboardOrders = [];
      if (userStores?.[0]) {
        const { data: dashOrders } = await sb
          .from("orders")
          .select("*")
          .eq("store_id", userStores[0].id)
          .order("created_at", { ascending: false });
        dashboardOrders = dashOrders || [];
      }

      // Get orders using the old dashboard method (with joins)
      let oldDashboardOrders = [];
      if (userStores?.[0]) {
        const { data: oldOrders } = await sb
          .from("stores")
          .select("*, orders(*)")
          .eq("id", userStores[0].id);
        oldDashboardOrders = oldOrders?.[0]?.orders || [];
      }

      setDebugData({
        user: user,
        userStores: userStores,
        allOrders: allOrders,
        dashboardOrders: dashboardOrders,
        oldDashboardOrders: oldDashboardOrders,
      });
      setLoading(false);
    }

    fetchAllData();
  }, []);

  if (loading) return <div className="p-8">Loading detailed debug...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Detailed Debug Analysis</h1>

      {/* User Info */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Current User</h2>
        <p>
          <strong>User ID:</strong> {debugData.user?.id}
        </p>
        <p>
          <strong>Email:</strong> {debugData.user?.email}
        </p>
      </div>

      {/* User Stores */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">
          User Stores ({debugData.userStores?.length || 0})
        </h2>
        {debugData.userStores?.map((store: any) => (
          <div key={store.id} className="border-l-4 border-green-500 pl-3 mb-2">
            <p>
              <strong>Store:</strong> {store.name} (Handle: {store.handle})
            </p>
            <p>
              <strong>Store ID:</strong> {store.id}
            </p>
            <p>
              <strong>Owner ID:</strong> {store.owner_id}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dashboard Orders (New Method) */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-red-600">
            Dashboard Orders (New Method) -{" "}
            {debugData.dashboardOrders?.length || 0}
          </h2>
          <p className="text-sm mb-3">
            Query: orders table filtered by store_id
          </p>
          {debugData.dashboardOrders?.map((order: any) => (
            <div
              key={order.id}
              className="bg-white p-3 rounded mb-2 border-l-4 border-red-500"
            >
              <p>
                <strong>{order.buyer_name}</strong>
              </p>
              <p className="text-red-600 font-bold">
                total_cents: {order.total_cents}
              </p>
              <p className="text-red-600 font-bold">
                Display: ₹{(order.total_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">ID: {order.id}</p>
              <p className="text-xs text-gray-500">
                Store ID: {order.store_id}
              </p>
            </div>
          ))}
        </div>

        {/* Old Dashboard Orders */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">
            Old Dashboard Orders - {debugData.oldDashboardOrders?.length || 0}
          </h2>
          <p className="text-sm mb-3">Query: stores table with orders join</p>
          {debugData.oldDashboardOrders?.map((order: any) => (
            <div
              key={order.id}
              className="bg-white p-3 rounded mb-2 border-l-4 border-orange-500"
            >
              <p>
                <strong>{order.buyer_name}</strong>
              </p>
              <p className="text-orange-600 font-bold">
                total_cents: {order.total_cents}
              </p>
              <p className="text-orange-600 font-bold">
                Display: ₹{(order.total_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">ID: {order.id}</p>
              <p className="text-xs text-gray-500">
                Store ID: {order.store_id}
              </p>
            </div>
          ))}
        </div>

        {/* All Orders */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            All Orders (No Filter) - {debugData.allOrders?.length || 0}
          </h2>
          <p className="text-sm mb-3">Query: all orders from database</p>
          {debugData.allOrders?.map((order: any) => (
            <div
              key={order.id}
              className="bg-white p-3 rounded mb-2 border-l-4 border-gray-500"
            >
              <p>
                <strong>{order.buyer_name}</strong>
              </p>
              <p className="text-blue-600 font-bold">
                total_cents: {order.total_cents}
              </p>
              <p className="text-blue-600 font-bold">
                Display: ₹{(order.total_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Store: {order.stores?.name} ({order.stores?.handle})
              </p>
              <p className="text-xs text-gray-500">
                Store Owner: {order.stores?.owner_id}
              </p>
              <p className="text-xs text-gray-500">Order ID: {order.id}</p>
              <p className="text-xs text-gray-500">
                Store ID: {order.store_id}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Raw Data */}
      <div className="mt-8 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Raw Data (JSON)</h2>
        <pre className="text-xs overflow-auto max-h-96">
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
