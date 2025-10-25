"use client";

import { useState } from "react";
import { useSubscription } from "./SubscriptionProvider";

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
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

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

    const baseMessage = `🚀 Start your FREE WhatsApp Store today!\n\n✅ 30 days completely FREE\n✅ Create unlimited products\n✅ Take orders via WhatsApp\n✅ Professional dashboard\n\nUse my referral link to get started! 🎁\n\n${referralUrl}\n\n#WhatsAppBusiness #OnlineStore #Entrepreneur`;

    const limitMessage = hasReachedReferralLimit
      ? `\n\n(I've already earned my max free months, but you'll still get your 30-day trial!)`
      : `\n\nUse my referral link and we both get an extra month FREE! 🎁`;

    const message = baseMessage.replace(
      "Use my referral link to get started! 🎁",
      hasReachedReferralLimit
        ? "Use my referral link to get started! 🎁" + limitMessage
        : "Use my referral link and we both get an extra month FREE! 🎁"
    );

    await navigator.clipboard.writeText(message);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white mb-6 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎁</span>
            <h3 className="text-xl font-bold">
              Refer Friends & Get FREE Months!
            </h3>
          </div>

          <p className="text-green-100 mb-4">
            Share your referral link and get <strong>1 month FREE</strong> for
            each friend who signs up!
            <span className="block mt-1 text-yellow-200">
              📊 {referralCount}/{maxReferrals} referrals used •{" "}
              {remainingReferrals} months remaining
            </span>
            {status === "trial" && (
              <span className="block mt-1 text-yellow-200">
                ⏰ You have {daysRemaining} days left in your free trial
              </span>
            )}
            {hasReachedReferralLimit && (
              <span className="block mt-1 text-orange-200 font-semibold">
                ℹ️ You've earned the maximum 6 months free! You can still share
                your code to help friends get started.
              </span>
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            {!referralCode ? (
              <button
                onClick={handleCreateCode}
                disabled={isCreatingCode}
                className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {isCreatingCode ? "Creating..." : "Generate My Referral Code"}
              </button>
            ) : (
              <>
                <div className="flex-1 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-sm opacity-90 mb-1">
                    Your Referral Code:
                  </div>
                  <div className="font-mono text-lg font-bold">
                    {referralCode}
                  </div>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                >
                  {showCopied ? "✅ Copied!" : "📋 Copy Link"}
                </button>

                <button
                  onClick={handleCopyMessage}
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  📱 Copy Message
                </button>
              </>
            )}
          </div>

          {referralCount > 0 && (
            <div className="mt-4 bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <span className="font-semibold">
                  {referralCount} successful referral
                  {referralCount !== 1 ? "s" : ""}!
                </span>
                {hasReachedReferralLimit && (
                  <span className="text-green-200 text-sm ml-2">
                    (You're awesome! 🌟)
                  </span>
                )}
              </div>
              <div className="text-sm opacity-90 mt-1">
                Earned: {referralCount} free months
                {!hasReachedReferralLimit &&
                  ` • Remaining: ${remainingReferrals} months`}
                {hasReachedReferralLimit && " • Keep sharing to help others!"}
              </div>
            </div>
          )}
        </div>

        <div className="ml-4 text-right">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-sm opacity-90">After Trial</div>
            <div className="text-2xl font-bold">₹259</div>
            <div className="text-sm opacity-90">per month</div>
          </div>
        </div>
      </div>

      {/* Features highlight */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Unlimited Products</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>WhatsApp Integration</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Order Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Analytics Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}
