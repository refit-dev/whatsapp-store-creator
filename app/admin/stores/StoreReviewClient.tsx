"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";
import Link from "next/link";

type Store = Database["public"]["Tables"]["stores"]["Row"];

export function StoreReviewClient({
  initialStores,
}: {
  initialStores: Store[];
}) {
  const [stores, setStores] = useState(initialStores);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (store: Store) => {
    if (
      !confirm(
        `Are you sure you want to approve "${store.name}"? The store will go live immediately.`
      )
    ) {
      return;
    }

    setProcessingId(store.id);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, action: "approve" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve store");
      }

      // Remove from list
      setStores(stores.filter((s) => s.id !== store.id));
      alert("Store approved successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve store");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (store: Store) => {
    const reason = prompt(
      `Please provide a reason for rejecting "${store.name}":`
    );

    if (!reason || !reason.trim()) {
      alert("Rejection reason is required");
      return;
    }

    setProcessingId(store.id);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          action: "reject",
          rejectionReason: reason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject store");
      }

      // Remove from list
      setStores(stores.filter((s) => s.id !== store.id));
      alert("Store rejected successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to reject store");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {stores.map((store) => (
        <div
          key={store.id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            {/* Store Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {store.logo_url && (
                  <img
                    src={store.logo_url}
                    alt={store.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {store.name}
                  </h2>
                  <p className="text-sm text-gray-600">@{store.handle}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted:{" "}
                    {store.created_at
                      ? new Date(store.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <Link
                href={`/${store.handle}`}
                target="_blank"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Preview Store →
              </Link>
            </div>

            {/* Store Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  WhatsApp Number
                </p>
                <p className="text-sm text-gray-900">{store.whatsapp_e164}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Currency
                </p>
                <p className="text-sm text-gray-900">{store.currency}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Payment Provider
                </p>
                <p className="text-sm text-gray-900">
                  {store.payment_provider || "None"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Payments Enabled
                </p>
                <p className="text-sm text-gray-900">
                  {store.is_payments_enabled ? "Yes" : "No"}
                </p>
              </div>
            </div>

            {/* Banner Preview */}
            {store.banner_url && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Store Banner
                </p>
                <img
                  src={store.banner_url}
                  alt="Store banner"
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => handleApprove(store)}
                disabled={processingId === store.id}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {processingId === store.id
                  ? "Processing..."
                  : "✅ Approve Store"}
              </button>
              <button
                onClick={() => handleReject(store)}
                disabled={processingId === store.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {processingId === store.id
                  ? "Processing..."
                  : "❌ Reject Store"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
