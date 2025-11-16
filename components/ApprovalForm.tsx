"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";

type Store = Database["public"]["Tables"]["stores"]["Row"];

interface ApprovalFormProps {
  store: Store;
  onSuccess: () => void;
}

export function ApprovalForm({ store, onSuccess }: ApprovalFormProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async () => {
    if (
      !confirm(
        `Are you sure you want to approve "${store.name}"? The store will go live immediately.`
      )
    ) {
      return;
    }

    setIsApproving(true);
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

      alert("Store approved successfully!");
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to approve store");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);
    try {
      const response = await fetch("/api/admin/approve-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject store");
      }

      alert("Store rejected successfully!");
      setShowRejectModal(false);
      setRejectionReason("");
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to reject store");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isApproving ? "Approving..." : "✅ Approve Store"}
        </button>
        <button
          onClick={() => setShowRejectModal(true)}
          disabled={isRejecting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          ❌ Reject Store
        </button>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Store: {store.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejection. This will be sent to the
              seller.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Products violate policy, inappropriate content, missing information..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={isRejecting}
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
