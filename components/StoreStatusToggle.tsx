"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface StoreStatusToggleProps {
  storeId: string;
  initialIsActive: boolean;
}

export function StoreStatusToggle({
  storeId,
  initialIsActive,
}: StoreStatusToggleProps) {
  const sb = supabaseBrowser();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);

  const handleToggle = async (newStatus: boolean) => {
    // If deactivating, show confirmation modal
    if (!newStatus) {
      setPendingStatus(newStatus);
      setShowConfirmModal(true);
      return;
    }

    // If activating, proceed directly
    await updateStoreStatus(newStatus);
  };

  const updateStoreStatus = async (newStatus: boolean) => {
    setLoading(true);
    setMessage("");

    try {
      const { error } = await sb
        .from("stores")
        .update({ is_active: newStatus })
        .eq("id", storeId);

      if (error) throw error;

      setIsActive(newStatus);
      setMessage(
        newStatus
          ? "✓ Store is now active and visible to customers"
          : "✓ Store is now inactive. Customers will see a 'temporarily closed' message"
      );
      setShowConfirmModal(false);
      setPendingStatus(null);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("Error updating store status:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeactivation = () => {
    if (pendingStatus !== null) {
      updateStoreStatus(pendingStatus);
    }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Store Status
            </h3>
            <p className="text-sm text-gray-600">
              Control whether your store is visible to customers
            </p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isActive ? "● ACTIVE" : "● INACTIVE"}
          </div>
        </div>

        {/* Status Description */}
        <div
          className={`mb-4 p-4 rounded-lg border ${
            isActive
              ? "bg-green-50 border-green-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{isActive ? "🟢" : "🔴"}</span>
            <div className="flex-1">
              <p
                className={`text-sm font-medium mb-1 ${
                  isActive ? "text-green-900" : "text-amber-900"
                }`}
              >
                {isActive
                  ? "Your store is currently ACTIVE"
                  : "Your store is currently INACTIVE"}
              </p>
              <p
                className={`text-sm ${
                  isActive ? "text-green-700" : "text-amber-700"
                }`}
              >
                {isActive
                  ? "Customers can browse products and place orders"
                  : "Customers will see a 'Store Temporarily Closed' message"}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => handleToggle(!isActive)}
          disabled={loading}
          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </span>
          ) : isActive ? (
            "Deactivate Store"
          ) : (
            "Activate Store"
          )}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes("Error")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            💡 When to use this:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1.5">
            <li>• Taking a break or vacation</li>
            <li>• Temporarily out of stock on all items</li>
            <li>• Store maintenance or updates</li>
            <li>• Need to pause orders temporarily</li>
          </ul>
          <p className="text-xs text-gray-600 mt-3">
            <strong>Note:</strong> Your store data (products, orders, settings)
            remains saved. You can reactivate anytime.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Deactivate Store?
              </h3>
              <p className="text-gray-600">
                Are you sure you want to temporarily close your store?
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-900 font-medium mb-2">
                What happens when you deactivate:
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>✓ Customers will see "Store Temporarily Closed"</li>
                <li>✓ Products won't be visible to customers</li>
                <li>✓ New orders cannot be placed</li>
                <li>✓ Your data remains safe</li>
                <li>✓ You can reactivate anytime</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingStatus(null);
                }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivation}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? "Deactivating..." : "Yes, Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
