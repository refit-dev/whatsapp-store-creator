"use client";
import { useEffect, useMemo, useState } from "react";

type Props = {
  storeId: string;
  initialPhone?: string | null;
};

export default function MobileVerification({ storeId, initialPhone }: Props) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    verified: boolean;
    verifiedAt: string | null;
    expiresAt: string | null;
    attempts: number;
    phone: string | null;
  } | null>(null);
  const [message, setMessage] = useState<string>("");

  const canVerify = useMemo(() => Boolean(code && code.length === 6), [code]);

  async function fetchStatus() {
    const res = await fetch(`/api/whatsapp/status?storeId=${storeId}`);
    const data = await res.json();
    if (res.ok) {
      setStatus(data);
      if (!phone && data.phone) setPhone(data.phone);
    } else {
      setMessage(data.error || "Failed to load status");
    }
  }

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  async function sendOtp() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/whatsapp/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Show detailed error if available
        const errorMsg = data.details
          ? `${data.error}\n\n${data.details}`
          : data.error || "Failed to send code";
        throw new Error(errorMsg);
      }
      setMessage("Code sent via SMS. It expires in 10 minutes.");
      fetchStatus();
    } catch (e: any) {
      setMessage(e.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!canVerify) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/whatsapp/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setMessage("Number verified successfully.");
      setCode("");
      fetchStatus();
    } catch (e: any) {
      setMessage(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  const verified = status?.verified;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📱</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Phone Verification
          </h3>
          <p className="text-sm text-gray-600">
            Required to share your store link
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Phone Display + Send Code */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 px-4 py-3 bg-white rounded-lg border border-gray-300">
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="font-mono text-gray-900">{phone || "Not set"}</p>
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading || !phone}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow whitespace-nowrap"
          >
            {loading ? "Sending..." : "📤 Send Code"}
          </button>
        </div>

        {/* Enter Code */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canVerify && !loading) {
                  e.preventDefault();
                  verifyOtp(e as any);
                }
              }}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent tracking-[0.5em] text-center text-lg font-mono"
            />
          </div>
          <button
            type="button"
            onClick={(e) => verifyOtp(e as any)}
            disabled={loading || !canVerify}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow whitespace-nowrap self-end"
          >
            {loading ? "Verifying..." : "✓ Verify"}
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`p-4 rounded-lg border-2 ${
              verified
                ? "bg-green-50 text-green-800 border-green-300"
                : "bg-yellow-50 text-yellow-800 border-yellow-300"
            }`}
          >
            {verified ? (
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">✅</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base">Phone Verified!</p>
                  {status.verifiedAt && (
                    <p className="text-sm mt-0.5 opacity-90">
                      {new Date(status.verifiedAt).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm mt-1.5 font-medium">
                    🎉 You can now share your store link
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base">
                    Verification Required
                  </p>
                  <p className="text-sm mt-0.5">
                    {status.expiresAt
                      ? `Code expires at ${new Date(
                          status.expiresAt
                        ).toLocaleTimeString()}`
                      : "Click 'Send Code' to get started"}
                  </p>
                  <p className="text-sm mt-1.5 font-medium">
                    Store sharing is disabled until verified
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional Messages */}
        {message && (
          <div
            className={`p-4 rounded-lg border-2 text-sm ${
              message.includes("Error") ||
              message.includes("Failed") ||
              message.includes("Trial")
                ? "bg-red-50 text-red-800 border-red-300"
                : "bg-blue-50 text-blue-800 border-blue-300"
            }`}
          >
            <div className="whitespace-pre-line leading-relaxed">{message}</div>
            {message.includes("Trial") && (
              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm hover:shadow"
              >
                🔗 Verify Number in Twilio
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
