"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";

type Store = Database["public"]["Tables"]["stores"]["Row"];

interface ApprovalFormProps {
  store: Store;
  onSuccess: () => void;
}

// Updated to handle blocking/unblocking instead of approving/rejecting
export function ApprovalForm({ store, onSuccess }: ApprovalFormProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);

  const handleUnblock = async () => {
    if (
      !confirm(
        `Are you sure you want to unblock "${store.name}"? The store will be publicly accessible.`
      )
    ) {
      return;
    }

    setIsUnblocking(true);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: store.id, action: "unblock" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unblock store");
      }

      alert("Store unblocked successfully!");
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to unblock store");
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      alert("Please provide a reason for blocking");
      return;
    }

    setIsBlocking(true);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          action: "block",
          blockReason: blockReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to block store");
      }

      alert("Store blocked successfully!");
      setShowBlockModal(false);
      setBlockReason("");
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to block store");
    } finally {
      setIsBlocking(false);
    }
  };

  // If store is already blocked, show unblock button
  if (store.is_blocked) {
    return (
      <div className="flex gap-3">
        <button
          onClick={handleUnblock}
          disabled={isUnblocking}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isUnblocking ? "Unblocking..." : "✅ Unblock Store"}
        </button>
      </div>
    );
  }

  // If store is not blocked, show block button
  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowBlockModal(true)}
          disabled={isBlocking}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          🚫 Block Store
        </button>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Block Store: {store.name}
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
                onClick={handleBlock}
                disabled={isBlocking || !blockReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isBlocking ? "Blocking..." : "Confirm Block"}
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason("");
                }}
                disabled={isBlocking}
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
