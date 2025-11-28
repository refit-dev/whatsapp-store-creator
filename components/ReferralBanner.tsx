"use client";

import { useState } from "react";
import { useSubscription } from "./SubscriptionProvider";
import { useCurrency } from "./CurrencyProvider";

export function ReferralBanner() {
  const {
    referralCode,
    referralCount,
    maxReferrals,
    remainingReferrals,
    hasReachedReferralLimit,
    createReferralCode,
    status,
    daysRemaining,
  } = useSubscription();
  const { prices } = useCurrency();
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCreateCode = async () => {
    setIsCreatingCode(true);
    try {
      await createReferralCode();
    } finally {
      setIsCreatingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    const referralUrl = `${window.location.origin}?ref=${referralCode}`;
    await navigator.clipboard.writeText(referralUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleCopyMessage = async () => {
    if (!referralCode) return;

    const referralUrl = `${window.location.origin}?ref=${referralCode}`;

    const baseMessage = [
      "Start your FREE WhatsApp Store today!",
      "",
      "- 14 days completely FREE",
      "- Create unlimited products",
      "- Take orders via WhatsApp",
      "- Professional dashboard",
      "",
      "Use my referral link to get started! You get +15 extra days when you upgrade, and I earn 1 month free.",
      "",
      referralUrl,
      "",
      "#WhatsAppBusiness #OnlineStore #Entrepreneur",
    ].join("\n");

    const limitMessage =
      "\n\nWhen you upgrade, I get 1 month FREE and you get +15 extra days. Let's grow together!";

    const message = baseMessage + limitMessage;

    await navigator.clipboard.writeText(message);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl text-white shadow-lg">
      {/* Compact Header - Always Visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/10 transition-colors rounded-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">★</span>
          <div>
            <h3 className="font-bold text-lg">Get FREE Months!</h3>
            <p className="text-sm text-green-100">
              Earn 1 month free for each paid referral; friends get +15 days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-sm opacity-90">After Trial</div>
            <div className="text-xl font-bold">{prices.monthly}/mo</div>
          </div>
          <button className="text-white/80 hover:text-white">
            <svg
              className={`w-5 h-5 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-white/20">
          <div className="pt-4">
            <p className="text-green-100 mb-4">
              Share your referral link and get <strong>1 month FREE</strong>{" "}
              when your friend upgrades to a paid plan. They also get 15 extra
              days added to their plan.
              {status === "trial" && (
                <span className="block mt-1 text-yellow-200">
                  • You have {daysRemaining} days left in your free trial
                </span>
              )}
            </p>

            <div className="space-y-3">
              {!referralCode ? (
                <button
                  onClick={handleCreateCode}
                  disabled={isCreatingCode}
                  className="w-full sm:w-auto bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  {isCreatingCode ? "Creating..." : "Generate My Referral Code"}
                </button>
              ) : (
                <>
                  <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                    <div className="text-sm opacity-90 mb-1">
                      Your Referral Code:
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {referralCode}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex-1 bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors text-sm"
                    >
                      {showCopied ? "Copied!" : "Copy Link"}
                    </button>

                    <button
                      onClick={handleCopyMessage}
                      className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors text-sm"
                    >
                      Copy Message
                    </button>
                  </div>
                </>
              )}
            </div>

            {referralCount > 0 && (
              <div className="mt-4 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">★</span>
                  <span className="font-semibold">
                    {referralCount} successful paid referral
                    {referralCount !== 1 ? "s" : ""}!
                  </span>
                </div>
                <div className="text-sm opacity-90 mt-1">
                  Earned: {referralCount} free month
                  {referralCount !== 1 ? "s" : ""} • Keep sharing to earn more!
                </div>
              </div>
            )}

            {/* Features highlight */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>Unlimited Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>WhatsApp Integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>Order Management</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>•</span>
                  <span>Analytics Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
