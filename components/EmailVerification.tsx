"use client";

import { useState } from "react";

interface EmailVerificationProps {
  email: string;
  userId?: string;
  onVerified?: () => void;
  onCancel?: () => void;
}

export function EmailVerification({
  email,
  userId,
  onVerified,
  onCancel,
}: EmailVerificationProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const sendVerificationCode = async () => {
    setIsSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/verification/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Verification code sent to your email!");
      } else {
        setMessage(data.error || "Failed to send verification code");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setMessage("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/verification/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setMessage("Email verified successfully!");
        onVerified?.();
      } else {
        setMessage(data.error || "Verification failed");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      verifyCode();
    }
  };

  if (isVerified) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Email Verified!
          </h3>
          <p className="text-green-600 mb-4">
            Your email address has been successfully verified.
          </p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">📧</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Verify Your Email
        </h3>
        <p className="text-gray-600">We'll send a verification code to:</p>
        <p className="font-medium text-blue-600 mt-1">{email}</p>
      </div>

      {!message.includes("sent") ? (
        <div className="space-y-4">
          <button
            onClick={sendVerificationCode}
            disabled={isSending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isSending ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-digit verification code:
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              onKeyPress={handleKeyPress}
              placeholder="123456"
              className="w-full p-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={verifyCode}
              disabled={isLoading || code.length !== 6}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            <button
              onClick={sendVerificationCode}
              disabled={isSending}
              className="px-4 py-3 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
            >
              {isSending ? "Sending..." : "Resend"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            message.includes("Error") ||
            message.includes("failed") ||
            message.includes("Invalid")
              ? "bg-red-50 text-red-800 border border-red-200"
              : message.includes("successfully")
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}

      {onCancel && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="w-full text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
