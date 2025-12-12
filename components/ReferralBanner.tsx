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

  const handleShareWhatsApp = () => {
    if (!referralCode) return;

    const referralUrl = `${window.location.origin}?ref=${referralCode}`;

    const message = [
      "🎉 Start your FREE WhatsApp Store today!",
      "",
      "✅ 14 days completely FREE",
      "✅ Create unlimited products",
      "✅ Take orders via WhatsApp",
      "✅ Professional dashboard",
      "",
      "Use my referral link to get started! You get +15 extra days when you upgrade, and I earn 1 month free.",
      "",
      referralUrl,
      "",
      "#WhatsAppBusiness #OnlineStore #Entrepreneur",
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
            <div className="flex items-center justify-end gap-2">
              <span className="text-base line-through opacity-70">₹259</span>
              <span className="text-xl font-bold">{prices.monthly}/mo</span>
            </div>
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
                      onClick={handleShareWhatsApp}
                      className="flex-1 bg-[#25D366] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#20BA5A] transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      Share on WhatsApp
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
