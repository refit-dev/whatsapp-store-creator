"use client";

import { useState } from "react";

interface MobileVerificationProps {
  phoneNumber: string;
  userId?: string;
  onVerified?: (verifiedPhone: string) => void;
  onCancel?: () => void;
}

export function MobileVerification({
  phoneNumber: initialPhoneNumber,
  userId,
  onVerified,
  onCancel,
}: MobileVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const sendVerificationCode = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setMessage("Please enter a valid phone number");
      return;
    }

    setIsSending(true);
    setMessage("");

    try {
      const response = await fetch("/api/verification/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Verification code sent to your mobile number!");
        setCodeSent(true);
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
      const response = await fetch("/api/verification/verify-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, code, userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        setVerifiedPhone(data.verifiedPhone);
        setMessage("Mobile number verified successfully!");
        onVerified?.(data.verifiedPhone);
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

  const formatPhoneForDisplay = (phone: string) => {
    // Format phone number for better display
    if (phone.startsWith("+91")) {
      const number = phone.slice(3);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phone;
  };

  if (isVerified) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Mobile Number Verified!
          </h3>
          <p className="text-green-600 mb-2">
            Your mobile number has been successfully verified.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Verified: {formatPhoneForDisplay(verifiedPhone)}
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
        <div className="text-4xl mb-4">📱</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Verify Your Mobile Number
        </h3>
        {phoneNumber ? (
          <div>
            <p className="text-gray-600">We'll send a verification code to:</p>
            <p className="font-medium text-blue-600 mt-1">
              {formatPhoneForDisplay(phoneNumber)}
            </p>
            <button
              onClick={() => setPhoneNumber("")}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              Change number
            </button>
          </div>
        ) : (
          <p className="text-gray-600">Enter your mobile number to verify</p>
        )}
      </div>

      {!phoneNumber ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number (with country code)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +91 for India, +1 for USA)
            </p>
          </div>
          <button
            onClick={sendVerificationCode}
            disabled={isSending || !phoneNumber.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {isSending ? "Sending..." : "Send Verification Code"}
          </button>
        </div>
      ) : !codeSent ? (
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

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          💡 SMS charges may apply. Make sure you have network coverage.
        </p>
      </div>

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
