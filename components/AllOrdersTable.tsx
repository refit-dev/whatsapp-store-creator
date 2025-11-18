"use client";

import { useState } from "react";
import { toLocaleString } from "@/lib/currency";
import { CopyOrderButton } from "./CopyOrderButton";
import OrderCancelModal from "./OrderCancelModal";
import Link from "next/link";

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

interface AllOrdersTableProps {
  initialOrders: Order[];
  currency: string;
  storeId: string;
}

export function AllOrdersTable({
  initialOrders,
  currency,
  storeId,
}: AllOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh the page to get latest data
      window.location.reload();
    } catch (error) {
      console.error("Error refreshing:", error);
      setIsRefreshing(false);
    }
  };

  const handleCancelClick = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = () => {
    setShowCancelModal(false);
    setSelectedOrder(null);
    // Refresh to show updated status
    window.location.reload();
  };

  const canCancelOrder = (order: Order) => {
    return (
      order.status !== "cancelled" &&
      order.status !== "delivered" &&
      order.status !== "completed"
    );
  };

  // Filter orders based on status
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Count orders by status
  const allCount = orders.length;
  const paidCount = orders.filter((o) => o.status === "paid").length;
  const createdCount = orders.filter((o) => o.status === "created").length;
  const openedWhatsappCount = orders.filter(
    (o) => o.status === "opened_whatsapp"
  ).length;

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            📋 All Orders
          </h3>
        </div>
        <div className="text-center py-12 px-4">
          <div className="text-4xl md:text-6xl mb-4">📦</div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
            No Orders Yet
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
            Orders will appear here once customers start ordering
          </p>
          <Link
            href="/dashboard/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Add Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header with Filter and Refresh */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              📋 All Orders
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mt-1">
              {filteredOrders.length} of {allCount} orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none cursor-pointer"
              >
                <option value="all">All Orders ({allCount})</option>
                <option value="paid">✅ Paid ({paidCount})</option>
                <option value="created">🆕 Created ({createdCount})</option>
                <option value="opened_whatsapp">
                  💬 WhatsApp ({openedWhatsappCount})
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              title="Refresh orders"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden">
        <div className="divide-y divide-gray-200">
          {filteredOrders.map((order: Order) => (
            <div key={order.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {order.buyer_name}
                  </p>
                  <p className="text-sm text-gray-600">{order.buyer_phone}</p>
                </div>
                <span
                  className={`ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
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
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items:</span>
                  <span className="text-gray-900">
                    {order.items?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-gray-900">
                    {toLocaleString(order.total_cents || 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
                <CopyOrderButton order={order} currency={currency} />
                {canCancelOrder(order) && (
                  <button
                    onClick={() => handleCancelClick(order)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium shadow-sm hover:shadow"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Date & Time
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
            {filteredOrders.map((order: Order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900 text-sm">
                    {order.buyer_name}
                  </p>
                  <p className="text-xs text-gray-600">{order.buyer_phone}</p>
                  {order.buyer_address && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                      {order.buyer_address}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-1">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx} className="text-xs text-gray-900">
                          {item.qty}x {item.title}
                        </p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-gray-600">
                          +{order.items.length - 2} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">No items</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-gray-900">
                    {toLocaleString(order.total_cents || 0, currency)}
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
                  <div className="flex items-center gap-2">
                    <CopyOrderButton order={order} currency={currency} />
                    {canCancelOrder(order) && (
                      <button
                        onClick={() => handleCancelClick(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow"
                        title="Cancel this order"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && selectedOrder && (
        <OrderCancelModal
          orderId={selectedOrder.id}
          storeId={storeId}
          orderTotal={(selectedOrder.total_cents || 0) / 100}
          paymentStatus={selectedOrder.status}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}
