"use client";

import { useState, useEffect } from "react";
import { EmailVerification } from "./EmailVerification";
import { MobileVerification } from "./MobileVerification";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface VerificationStatusProps {
  user: any;
  store?: any;
  onVerificationComplete?: () => void;
  showModal?: boolean;
  onClose?: () => void;
}

export function VerificationStatus({
  user,
  store,
  onVerificationComplete,
  showModal = false,
  onClose,
}: VerificationStatusProps) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "email" | "mobile" | "complete"
  >("email");
  const [showVerification, setShowVerification] = useState(showModal);

  const supabase = supabaseBrowser();

  useEffect(() => {
    if (user) {
      setEmailVerified(user.user_metadata?.email_verified || false);
      setMobileVerified(user.user_metadata?.mobile_verified || false);

      // Determine current step
      if (!user.user_metadata?.email_verified) {
        setCurrentStep("email");
      } else if (!user.user_metadata?.mobile_verified) {
        setCurrentStep("mobile");
      } else {
        setCurrentStep("complete");
      }
    }
  }, [user]);

  const handleEmailVerified = () => {
    setEmailVerified(true);
    setCurrentStep("mobile");
  };

  const handleMobileVerified = (verifiedPhone: string) => {
    setMobileVerified(true);
    setCurrentStep("complete");
    onVerificationComplete?.();
  };

  const handleClose = () => {
    setShowVerification(false);
    onClose?.();
  };

  const getVerificationBadge = (isVerified: boolean, type: string) => (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isVerified
          ? "bg-green-100 text-green-800"
          : "bg-yellow-100 text-yellow-800"
      }`}
    >
      {isVerified ? "✓" : "⚠"} {type} {isVerified ? "Verified" : "Not Verified"}
    </span>
  );

  // Compact status display
  const StatusDisplay = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-medium text-gray-800 mb-3">Verification Status</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Email</span>
          {getVerificationBadge(emailVerified, "Email")}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Mobile</span>
          {getVerificationBadge(mobileVerified, "Mobile")}
        </div>
      </div>

      {(!emailVerified || !mobileVerified) && (
        <button
          onClick={() => setShowVerification(true)}
          className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Complete Verification
        </button>
      )}
    </div>
  );

  // Modal/Step-by-step verification
  const VerificationModal = () => {
    if (currentStep === "complete") {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Verification Complete!
            </h3>
            <p className="text-green-600 mb-4">
              Both your email and mobile number have been verified.
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">Email: {user?.email}</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm">
                  Mobile: {user?.user_metadata?.mobile_number}
                </span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center space-x-2 ${
              currentStep === "email"
                ? "text-blue-600"
                : emailVerified
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                emailVerified
                  ? "bg-green-600 border-green-600 text-white"
                  : currentStep === "email"
                  ? "border-blue-600"
                  : "border-gray-300"
              }`}
            >
              {emailVerified ? "✓" : "1"}
            </div>
            <span className="text-sm font-medium">Email</span>
          </div>

          <div
            className={`w-8 h-0.5 ${
              emailVerified ? "bg-green-600" : "bg-gray-300"
            }`}
          ></div>

          <div
            className={`flex items-center space-x-2 ${
              currentStep === "mobile"
                ? "text-blue-600"
                : mobileVerified
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                mobileVerified
                  ? "bg-green-600 border-green-600 text-white"
                  : currentStep === "mobile"
                  ? "border-blue-600"
                  : "border-gray-300"
              }`}
            >
              {mobileVerified ? "✓" : "2"}
            </div>
            <span className="text-sm font-medium">Mobile</span>
          </div>
        </div>

        {/* Current Step */}
        {currentStep === "email" && (
          <EmailVerification
            email={user?.email || ""}
            userId={user?.id}
            onVerified={handleEmailVerified}
            onCancel={handleClose}
          />
        )}

        {currentStep === "mobile" && (
          <MobileVerification
            phoneNumber={
              store?.whatsapp_e164 ||
              user?.user_metadata?.mobile_number ||
              user?.phone ||
              ""
            }
            userId={user?.id}
            onVerified={handleMobileVerified}
            onCancel={handleClose}
          />
        )}
      </div>
    );
  };

  if (showVerification) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="max-w-md w-full max-h-[90vh] overflow-y-auto">
          <VerificationModal />
        </div>
      </div>
    );
  }

  return <StatusDisplay />;
}
