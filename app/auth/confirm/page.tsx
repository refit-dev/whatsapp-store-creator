"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ConfirmEmailPage() {
  const sb = supabaseBrowser();
  const search = useSearchParams();
  const initialEmail = useMemo(() => search.get("email") || "", [search]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      setMessage("Enter your email and the 6‑digit code we sent.");
    } else {
      setMessage(
        `We sent a 6‑digit code to ${email}. Enter it below to finish setup.`
      );
    }
  }, [email]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await sb.auth.verifyOtp({
        type: "signup",
        email,
        token: code.trim(),
      });

      if (error) {
        setMessage(error.message);
      } else if (data?.session) {
        setMessage("Verified! Redirecting to dashboard...");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 600);
      } else {
        setMessage("Verification failed. Please check the code and try again.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setMessage("Please enter your email first.");
      return;
    }
    setResending(true);
    setMessage("");
    try {
      const { error } = await sb.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Code resent. Check your inbox.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        <Link
          href="/auth"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Sign In
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Confirm your email
            </h1>
            <p className="text-gray-600">
              Enter the 6‑digit code we emailed you
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                6‑digit Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the code from the email. Codes expire after a short time.
              </p>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.toLowerCase().includes("verified") ||
                  message.toLowerCase().includes("resent")
                    ? "bg-green-50 text-green-800"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-600">Didn't get a code?</span>
            <button
              onClick={handleResend}
              disabled={resending || !email}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
