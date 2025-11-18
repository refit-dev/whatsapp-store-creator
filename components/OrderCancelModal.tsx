"use client";

import { useState } from "react";
import {
  getCancellationReasons,
  CancellationReason,
} from "@/lib/order-cancellation";

interface OrderCancelModalProps {
  orderId: string;
  storeId: string;
  orderTotal: number;
  paymentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrderCancelModal({
  orderId,
  storeId,
  orderTotal,
  paymentStatus,
  onClose,
  onSuccess,
}: OrderCancelModalProps) {
  const [reason, setReason] = useState<CancellationReason>("other");
  const [notes, setNotes] = useState("");
  const [partialRefund, setPartialRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState(orderTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancellationReasons = getCancellationReasons();
  const isPaid = paymentStatus === "paid";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          storeId,
          reason,
          notes: notes.trim() || undefined,
          refundAmount: partialRefund ? refundAmount : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cancel Order
          </h2>

          {/* Warning Message */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Warning: This action cannot be undone
                </h3>
                <p className="text-sm text-amber-800">
                  {isPaid
                    ? "The order will be cancelled and a refund will be processed automatically."
                    : "The order will be cancelled. The customer will be notified."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Cancellation Reason */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason *
              </label>
              <select
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value as CancellationReason)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {cancellationReasons.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Refund Options (if paid) */}
            {isPaid && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Refund Details
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!partialRefund}
                      onChange={() => {
                        setPartialRefund(false);
                        setRefundAmount(orderTotal);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Full Refund: ${orderTotal.toFixed(2)}
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={partialRefund}
                      onChange={() => setPartialRefund(true)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      Partial Refund
                    </span>
                  </label>
                  {partialRefund && (
                    <div className="ml-6">
                      <label className="block text-sm text-gray-700 mb-1">
                        Refund Amount *
                      </label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          type="number"
                          min="0"
                          max={orderTotal}
                          step="0.01"
                          value={refundAmount}
                          onChange={(e) =>
                            setRefundAmount(parseFloat(e.target.value) || 0)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Maximum: ${orderTotal.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">❌ {error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Order
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
