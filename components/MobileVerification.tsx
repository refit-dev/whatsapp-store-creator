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
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Verify Phone Number
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Verify your phone number to enable store sharing. We'll send a 6‑digit
        verification code via SMS.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number (E.164 format)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+12345678901"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your number with country code (e.g., +1 for US, +91 for
              India)
            </p>
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading || !phone}
            className="w-full md:w-auto px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Code"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6‑digit Code
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
              placeholder="123456"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center"
            />
          </div>
          <button
            type="button"
            onClick={(e) => verifyOtp(e as any)}
            disabled={loading || !canVerify}
            className="w-full md:w-auto px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>

        {status && (
          <div
            className={`p-4 rounded-lg ${
              verified
                ? "bg-green-50 text-green-800"
                : "bg-yellow-50 text-yellow-800"
            }`}
          >
            {verified ? (
              <div>
                <p className="font-semibold">✓ Phone number verified</p>
                {status.verifiedAt && (
                  <p className="text-sm mt-1">
                    Verified on {new Date(status.verifiedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-sm mt-1">
                  You can now share your store link!
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold">⚠ Phone verification required</p>
                <p className="text-sm mt-1">
                  {status.expiresAt
                    ? `Current code expires at ${new Date(
                        status.expiresAt
                      ).toLocaleTimeString()}.`
                    : "Send a code to begin verification."}
                </p>
                <p className="text-sm mt-1 font-medium">
                  You must verify your phone before sharing your store.
                </p>
              </div>
            )}
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-md text-sm ${
              message.includes("Error") ||
              message.includes("Failed") ||
              message.includes("Trial")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <div className="whitespace-pre-line">{message}</div>
            {message.includes("Trial") && (
              <a
                href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Verify Number in Twilio →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
