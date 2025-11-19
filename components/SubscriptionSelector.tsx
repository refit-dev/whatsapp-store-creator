"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

type SubscriptionPlan =
  Database["public"]["Tables"]["subscription_plans"]["Row"];
type SpecialOffer = Database["public"]["Tables"]["special_offers"]["Row"];

interface SubscriptionSelectorProps {
  onSuccess?: () => void;
}

export default function SubscriptionSelector({
  onSuccess,
}: SubscriptionSelectorProps) {
  const supabase = createClientComponentClient<Database>();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [offerCode, setOfferCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<SpecialOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load plans with razorpay_plan_id
      const { data: plansData, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .not("razorpay_plan_id", "is", null)
        .eq("is_trial", false)
        .order("price_cents", { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load active offers
      const { data: offersData, error: offersError } = await supabase
        .from("special_offers")
        .select("*")
        .eq("is_active", true);

      if (offersError) throw offersError;
      setOffers(offersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyOffer() {
    if (!offerCode.trim()) {
      setError("Please enter an offer code");
      return;
    }

    const offer = offers.find(
      (o) => o.code.toUpperCase() === offerCode.toUpperCase()
    );

    if (!offer) {
      setError("Invalid offer code");
      return;
    }

    // Check validity dates
    const now = new Date();
    if (offer.starts_at && new Date(offer.starts_at) > now) {
      setError("This offer is not yet active");
      return;
    }
    if (offer.ends_at && new Date(offer.ends_at) < now) {
      setError("This offer has expired");
      return;
    }

    setAppliedOffer(offer);
    setError(null);
  }

  function calculateDiscount(price: number, offer: SpecialOffer | null) {
    if (!offer) return { finalPrice: price, discount: 0 };

    let discount = 0;
    if (
      offer.offer_type === "percentage_discount" &&
      offer.percentage_off !== null
    ) {
      discount = Math.round(price * (offer.percentage_off / 100));
    } else if (
      offer.offer_type === "fixed_amount" &&
      offer.fixed_amount_off !== null
    ) {
      discount = offer.fixed_amount_off;
    }

    return {
      finalPrice: Math.max(0, price - discount),
      discount,
    };
  }

  async function handleSubscribe() {
    if (!selectedPlan) {
      setError("Please select a plan");
      return;
    }

    setSubscribing(true);
    setError(null);

    try {
      const response = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan,
          offer_code: appliedOffer?.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.success && data.subscription.short_url) {
        // Redirect to Razorpay payment page
        window.location.href = data.subscription.short_url;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (err: any) {
      setError(err.message);
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">
          Select a plan and start growing your business today
        </p>
      </div>

      {/* Featured offers banner */}
      {offers.length > 0 && !appliedOffer && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4">
          <p className="font-medium">🎉 Special Offers Available!</p>
          <p className="text-sm opacity-90">
            Enter a promo code below to save on your first payment
          </p>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const { finalPrice, discount } = calculateDiscount(
            plan.price_cents || 0,
            appliedOffer
          );

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-600 shadow-lg bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>

              <div className="mb-4">
                {discount > 0 && (
                  <div className="text-sm text-gray-500 line-through">
                    ₹{((plan.price_cents || 0) / 100).toFixed(0)}
                  </div>
                )}
                <div className="text-3xl font-bold">
                  ₹{(finalPrice / 100).toFixed(0)}
                  <span className="text-sm font-normal text-gray-600">
                    /month
                  </span>
                </div>
                {discount > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    Save ₹{(discount / 100).toFixed(0)} first month!
                  </div>
                )}
              </div>

              {plan.features && typeof plan.features === "object" && (
                <ul className="space-y-2 mb-4">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-start text-sm">
                      <span className="text-green-500 mr-2 mt-0.5">✓</span>
                      <span>
                        {key.replace(/_/g, " ")}: {String(value)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {isSelected && (
                <div className="mt-4 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded text-center">
                  Selected
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Offer code input */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Have a promo code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={offerCode}
            onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={!!appliedOffer}
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {appliedOffer ? (
            <button
              onClick={() => {
                setAppliedOffer(null);
                setOfferCode("");
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Remove
            </button>
          ) : (
            <button
              onClick={handleApplyOffer}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
          )}
        </div>
        {appliedOffer && (
          <div className="mt-2 text-sm text-green-600 font-medium">
            ✓ {appliedOffer.name} applied successfully!
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Subscribe button */}
      <button
        onClick={handleSubscribe}
        disabled={!selectedPlan || subscribing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        {subscribing ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating subscription...
          </span>
        ) : (
          "Continue to Payment"
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You will be redirected to Razorpay secure payment page. Subscription
        renews automatically each month.
      </p>
    </div>
  );
}
