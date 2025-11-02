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
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setMessage("Code sent on WhatsApp. It expires in 10 minutes.");
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
        Verify WhatsApp Number
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Before your store goes live, verify your WhatsApp number. We’ll send a
        6‑digit code to your WhatsApp via our business account.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Number (E.164)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+12345678901"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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

        <form
          onSubmit={verifyOtp}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
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
              placeholder="123456"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !canVerify}
            className="w-full md:w-auto px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {status && (
          <div
            className={`p-4 rounded-lg ${
              verified
                ? "bg-green-50 text-green-800"
                : "bg-yellow-50 text-yellow-800"
            }`}
          >
            {verified ? (
              <p>
                WhatsApp number is verified
                {status.verifiedAt
                  ? ` (since ${new Date(status.verifiedAt).toLocaleString()})`
                  : "."}
              </p>
            ) : (
              <p>
                Not verified yet.{" "}
                {status.expiresAt
                  ? `Current code expires at ${new Date(
                      status.expiresAt
                    ).toLocaleTimeString()}.`
                  : "Send a code to begin."}
              </p>
            )}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-md bg-blue-50 text-blue-800 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
