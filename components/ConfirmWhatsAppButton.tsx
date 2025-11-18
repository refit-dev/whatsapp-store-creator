"use client";

import { useState } from "react";

interface ConfirmWhatsAppButtonProps {
  orderId: string;
  onConfirmed?: () => void;
}

export function ConfirmWhatsAppButton({
  orderId,
  onConfirmed,
}: ConfirmWhatsAppButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/orders/confirm-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm order");
      }

      setConfirmed(true);
      onConfirmed?.();
    } catch (err: any) {
      console.error("Confirmation error:", err);
      setError(err.message || "Failed to confirm. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">
          ✅ Order Confirmed!
        </h3>
        <p className="text-green-700 text-sm">
          Thank you! We've received your confirmation and will process your
          order shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-6 w-6"
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
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Confirming...
          </>
        ) : (
          <>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ✓ I've Sent the WhatsApp Message
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Click this button after you've sent your order message on WhatsApp
      </p>
    </div>
  );
}
