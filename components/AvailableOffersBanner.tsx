"use client";

import { useState, useEffect } from "react";
import type { Database } from "@/types/supabase";

type SpecialOffer = Database["public"]["Tables"]["special_offers"]["Row"];

export default function AvailableOffersBanner() {
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      const response = await fetch("/api/apply-offer");
      const data = await response.json();

      if (response.ok) {
        // Only show featured offers in banner
        setOffers(data.offers.filter((o: SpecialOffer) => o.is_featured));
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function applyOffer(code: string) {
    setApplying(code);

    try {
      const response = await fetch("/api/apply-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerCode: code }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `Success! ${data.data.offer_name} has been applied to your account.`
        );
        loadOffers(); // Reload to remove claimed offer
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setApplying(null);
    }
  }

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {offers.map((offer) => (
        <div
          key={offer.id}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-2xl">🎉</span>
                <h3 className="text-xl font-bold">{offer.name}</h3>
              </div>
              <p className="text-white/90 mb-3">{offer.description}</p>
              <div className="flex items-center space-x-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                  Code: {offer.code}
                </span>
                {offer.offer_type === "percentage_discount" && (
                  <span className="text-lg font-bold">
                    {offer.percentage_off}% OFF
                  </span>
                )}
                {offer.offer_type === "extended_trial" && (
                  <span className="text-lg font-bold">
                    +{offer.extended_trial_days} Days Free
                  </span>
                )}
                {offer.offer_type === "fixed_amount" && (
                  <span className="text-lg font-bold">
                    ₹{(offer.fixed_amount_off! / 100).toFixed(0)} OFF
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => applyOffer(offer.code)}
              disabled={applying === offer.code}
              className="px-6 py-2 bg-white text-purple-600 font-semibold rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {applying === offer.code ? "Applying..." : "Claim Offer"}
            </button>
          </div>

          {offer.ends_at && (
            <div className="mt-4 text-sm text-white/80">
              ⏰ Offer ends: {new Date(offer.ends_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
