"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";
import Link from "next/link";

type Store = Database["public"]["Tables"]["stores"]["Row"];

export function AllStoresClient({
  stores: initialStores,
}: {
  stores: Store[];
}) {
  const [stores, setStores] = useState(initialStores);
  const [isBlocking, setIsBlocking] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [showBlockModal, setShowBlockModal] = useState<string | null>(null);

  const handleBlock = async (storeId: string) => {
    if (!blockReason.trim()) {
      alert("Please provide a reason for blocking");
      return;
    }

    setIsBlocking(storeId);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          action: "block",
          blockReason: blockReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to block store");
      }

      // Update local state
      setStores(
        stores.map((s) =>
          s.id === storeId
            ? { ...s, is_blocked: true, block_reason: blockReason.trim() }
            : s
        )
      );

      alert("Store blocked successfully!");
      setShowBlockModal(null);
      setBlockReason("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to block store");
    } finally {
      setIsBlocking(null);
    }
  };

  const handleUnblock = async (storeId: string, storeName: string) => {
    if (
      !confirm(
        `Are you sure you want to unblock "${storeName}"? The store will be publicly accessible.`
      )
    ) {
      return;
    }

    setIsBlocking(storeId);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action: "unblock" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unblock store");
      }

      // Update local state
      setStores(
        stores.map((s) =>
          s.id === storeId ? { ...s, is_blocked: false, block_reason: null } : s
        )
      );

      alert("Store unblocked successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to unblock store");
    } finally {
      setIsBlocking(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Moderation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {store.logo_url && (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {store.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">@{store.handle}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        store.is_blocked
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {store.is_blocked ? "Blocked" : "Active"}
                    </span>
                    {store.is_blocked && store.block_reason && (
                      <div className="text-xs text-gray-500 mt-1 max-w-xs">
                        {store.block_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        store.is_active
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {store.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {store.created_at
                      ? new Date(store.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/${store.handle}`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                    {store.is_blocked ? (
                      <button
                        onClick={() => handleUnblock(store.id, store.name)}
                        disabled={isBlocking === store.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {isBlocking === store.id ? "..." : "Unblock"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowBlockModal(store.id)}
                        disabled={isBlocking === store.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Block Store: {stores.find((s) => s.id === showBlockModal)?.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for blocking. This will be shown to the
              store owner.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g., Products violate policy, inappropriate content, fraudulent activity..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleBlock(showBlockModal)}
                disabled={isBlocking === showBlockModal || !blockReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isBlocking === showBlockModal
                  ? "Blocking..."
                  : "Confirm Block"}
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(null);
                  setBlockReason("");
                }}
                disabled={isBlocking === showBlockModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
