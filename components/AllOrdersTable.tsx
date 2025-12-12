"use client";

import { useEffect, useState, Dispatch, SetStateAction } from "react";
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
  initialOrders?: Order[];
  orders?: Order[];
  currency: string;
  storeId: string;
  totalCount?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: Dispatch<SetStateAction<number>>;
  onPageSizeChange?: (size: number) => void;
}

export function AllOrdersTable({
  initialOrders = [],
  orders: controlledOrders,
  currency,
  storeId,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: AllOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>(
    controlledOrders ?? initialOrders
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const totalRows = totalCount ?? orders.length;
  const pageSizeValue = (pageSize ?? orders.length) || 1;
  const currentPageValue = currentPage ?? 1;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSizeValue));

  // Keep internal state in sync if parent passes a new orders array
  useEffect(() => {
    if (controlledOrders) {
      setOrders(controlledOrders);
    }
  }, [controlledOrders]);

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

  const handleMarkPaid = async (order: Order) => {
    setMarkingPaidId(order.id);
    try {
      const res = await fetch("/api/orders/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, storeId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to mark order as paid");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "paid" } : o))
      );
    } catch (error: any) {
      console.error("Error marking paid:", error);
      alert(error?.message || "Failed to mark order as paid");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, storeId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(error?.message || "Failed to update order status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handlePaidCheckbox = async (orderId: string, isPaid: boolean) => {
    setUpdatingStatusId(orderId);
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, storeId, isPaid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update paid status");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: isPaid ? "paid" : "opened_whatsapp" }
            : o
        )
      );
    } catch (error: any) {
      console.error("Error updating paid status:", error);
      alert(error?.message || "Failed to update paid status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const canCancelOrder = (order: Order) => {
    return (
      order.status !== "cancelled" &&
      order.status !== "delivered" &&
      order.status !== "completed"
    );
  };

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
              Showing {orders.length} of {totalRows} orders
            </p>
          </div>

          <div className="flex items-center gap-2">
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
          {orders.map((order: Order) => (
            <div key={order.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {order.buyer_name}
                  </p>
                  <p className="text-sm text-gray-600">{order.buyer_phone}</p>
                </div>
                <div className="ml-2 shrink-0">
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    disabled={updatingStatusId === order.id}
                    className={`px-2 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                      order.status === "paid"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : order.status === "customer_confirmed"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : order.status === "opened_whatsapp"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : order.status === "delivered"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    <option value="created">Created</option>
                    <option value="opened_whatsapp">Opened</option>
                    <option value="customer_confirmed">Confirmed</option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
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
                {/* Paid Checkbox */}
                <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={order.status === "paid"}
                    onChange={(e) =>
                      handlePaidCheckbox(order.id, e.target.checked)
                    }
                    disabled={updatingStatusId === order.id}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    Paid
                  </span>
                </label>
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
            {orders.map((order: Order) => (
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
                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    disabled={updatingStatusId === order.id}
                    className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                      order.status === "paid"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : order.status === "customer_confirmed"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                        : order.status === "opened_whatsapp"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800 border-red-200"
                        : order.status === "delivered"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    }`}
                  >
                    <option value="created">Created</option>
                    <option value="opened_whatsapp">Opened WhatsApp</option>
                    <option value="customer_confirmed">
                      Customer Confirmed
                    </option>
                    <option value="paid">Paid</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {/* Paid Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={order.status === "paid"}
                        onChange={(e) =>
                          handlePaidCheckbox(order.id, e.target.checked)
                        }
                        disabled={updatingStatusId === order.id}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                      />
                      <span className="text-xs text-gray-700 font-medium">
                        Paid
                      </span>
                    </label>
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

      {/* Pagination */}
      {totalRows > pageSizeValue && onPageChange && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPageValue - 1)}
              disabled={currentPageValue <= 1}
              className="px-3 py-2 text-sm border rounded-lg bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPageValue} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPageValue + 1)}
              disabled={currentPageValue >= totalPages}
              className="px-3 py-2 text-sm border rounded-lg bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {onPageSizeChange && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-700">Rows per page:</span>
              <select
                value={pageSizeValue}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border rounded-lg px-2 py-1 bg-white"
              >
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

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
