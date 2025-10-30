"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  items: any[];
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
}

interface OrdersManagementProps {
  storeId: string;
}

export function OrdersManagement({ storeId }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const supabase = supabaseBrowser();

  useEffect(() => {
    loadOrders();
  }, [storeId]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading orders:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      alert("Order status updated successfully!");
    } catch (error: any) {
      alert(`Error updating order: ${error.message}`);
    }
  };

  const filteredOrders = orders.filter(
    (order) => statusFilter === "all" || order.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatWhatsAppReply = (order: Order) => {
    const orderItems = order.items
      .map((item: any) => `• ${item.title} x${item.qty}`)
      .join("\n");

    return encodeURIComponent(
      `✅ Order Confirmed!\n\n` +
        `Order ID: ${order.id}\n` +
        `Customer: ${order.customer_name}\n` +
        `Amount: ₹${order.total_amount}\n\n` +
        `Items:\n${orderItems}\n\n` +
        `Your order has been confirmed and will be processed shortly. We'll update you with delivery details soon!\n\n` +
        `Thank you for your order! 🙏`
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Order Details</h3>
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Back to Orders
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Info */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Order Information
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <strong>Order ID:</strong> {selectedOrder.id}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(selectedOrder.created_at)}
                </div>
                <div>
                  <strong>Amount:</strong> ₹{selectedOrder.total_amount}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Customer Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div>
                  <strong>Name:</strong> {selectedOrder.customer_name}
                </div>
                <div>
                  <strong>Phone:</strong> {selectedOrder.customer_phone}
                </div>
                {selectedOrder.customer_email && (
                  <div>
                    <strong>Email:</strong> {selectedOrder.customer_email}
                  </div>
                )}
                {selectedOrder.customer_address && (
                  <div>
                    <strong>Address:</strong> {selectedOrder.customer_address}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Order Items</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.title} x{item.qty}
                    </span>
                    <span>
                      ₹{Math.round((item.priceCents * item.qty) / 100)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedOrder.status}
              onChange={(e) =>
                updateOrderStatus(selectedOrder.id, e.target.value)
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending_payment">Pending Payment</option>
              <option value="paid">Payment Received</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <a
              href={`https://wa.me/${selectedOrder.customer_phone.replace(
                /[^0-9]/g,
                ""
              )}?text=${formatWhatsAppReply(selectedOrder)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <span className="mr-2">📱</span>
              Reply on WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="text-2xl mr-2">📦</span>
          Orders Management
        </h3>
        <button
          onClick={loadOrders}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Orders</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {statusFilter === "all"
            ? "No orders yet"
            : `No ${statusFilter.replace("_", " ")} orders`}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{order.total_amount}</div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
