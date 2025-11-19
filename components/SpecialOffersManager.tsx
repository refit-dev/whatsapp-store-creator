"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

type SpecialOffer = Database["public"]["Tables"]["special_offers"]["Row"];
type OfferRedemption = Database["public"]["Tables"]["offer_redemptions"]["Row"];

export default function SpecialOffersManager() {
  const supabase = createClientComponentClient<Database>();
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  async function loadOffers() {
    try {
      const { data, error } = await supabase
        .from("special_offers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleOfferStatus(offerId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("special_offers")
        .update({ is_active: !currentStatus })
        .eq("id", offerId);

      if (error) throw error;
      loadOffers();
    } catch (error) {
      console.error("Error toggling offer status:", error);
    }
  }

  async function deleteOffer(offerId: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    try {
      const { error } = await supabase
        .from("special_offers")
        .delete()
        .eq("id", offerId);

      if (error) throw error;
      loadOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
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
    <div className="space-y-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-base font-bold">Special Offers Management</h2>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingOffer(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create New Offer
        </button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <OfferForm
          offer={editingOffer}
          onSave={() => {
            setShowCreateForm(false);
            setEditingOffer(null);
            loadOffers();
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingOffer(null);
          }}
        />
      )}

      {/* Offers List */}
      <div className="grid gap-4">
        {offers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No offers created yet</p>
          </div>
        ) : (
          offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onEdit={() => {
                setEditingOffer(offer);
                setShowCreateForm(true);
              }}
              onToggle={() => toggleOfferStatus(offer.id, offer.is_active!)}
              onDelete={() => deleteOffer(offer.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  onEdit,
  onToggle,
  onDelete,
}: {
  offer: SpecialOffer;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const getOfferDescription = () => {
    switch (offer.offer_type) {
      case "percentage_discount":
        return `${offer.percentage_off}% off`;
      case "fixed_amount":
        return `₹${(offer.fixed_amount_off! / 100).toFixed(2)} off`;
      case "extended_trial":
        return `${offer.extended_trial_days} extra days trial`;
      case "free_upgrade":
        return `${offer.free_months} months free Pro`;
      case "referral_bonus":
        return "Referral bonus";
      default:
        return offer.offer_type;
    }
  };

  const isExpired = offer.ends_at && new Date(offer.ends_at) < new Date();
  const isActive = offer.is_active && !isExpired;

  return (
    <div
      className={`bg-white border rounded-lg p-6 ${
        !isActive ? "opacity-60" : ""
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-xl font-bold">{offer.name}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
              {offer.code}
            </span>
            {offer.is_featured && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                ⭐ Featured
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-2">{offer.description}</p>
          <p className="text-lg font-semibold text-green-600">
            {getOfferDescription()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Edit
          </button>
          <button
            onClick={onToggle}
            className={`px-3 py-1 text-sm rounded ${
              isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 border-t pt-4">
        <div>
          <p className="text-xs text-gray-500">Uses</p>
          <p className="font-semibold">
            {offer.current_uses} / {offer.max_uses || "∞"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Type</p>
          <p className="font-semibold capitalize">{offer.usage_limit_type}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Starts</p>
          <p className="font-semibold text-sm">
            {offer.starts_at
              ? new Date(offer.starts_at).toLocaleDateString()
              : "Now"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ends</p>
          <p className="font-semibold text-sm">
            {offer.ends_at
              ? new Date(offer.ends_at).toLocaleDateString()
              : "No limit"}
          </p>
        </div>
      </div>

      {isExpired && (
        <div className="mt-4 p-2 bg-red-50 text-red-700 text-sm rounded">
          ⚠️ This offer has expired
        </div>
      )}
    </div>
  );
}

function OfferForm({
  offer,
  onSave,
  onCancel,
}: {
  offer: SpecialOffer | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const supabase = createClientComponentClient<Database>();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: offer?.code || "",
    name: offer?.name || "",
    description: offer?.description || "",
    offer_type: offer?.offer_type || "percentage_discount",
    percentage_off: offer?.percentage_off || 10,
    fixed_amount_off: offer?.fixed_amount_off || 0,
    extended_trial_days: offer?.extended_trial_days || 30,
    free_months: offer?.free_months || 1,
    starts_at: offer?.starts_at
      ? new Date(offer.starts_at).toISOString().split("T")[0]
      : "",
    ends_at: offer?.ends_at
      ? new Date(offer.ends_at).toISOString().split("T")[0]
      : "",
    usage_limit_type: offer?.usage_limit_type || "unlimited",
    max_uses: offer?.max_uses || 100,
    max_uses_per_user: offer?.max_uses_per_user || 1,
    is_featured: offer?.is_featured || false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const offerData: any = {
        ...formData,
        code: formData.code.toUpperCase(),
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
        max_uses:
          formData.usage_limit_type === "limited" ? formData.max_uses : null,
        created_by: user.id,
      };

      if (offer) {
        const { error } = await supabase
          .from("special_offers")
          .update(offerData)
          .eq("id", offer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("special_offers")
          .insert(offerData);
        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      console.error("Error saving offer:", error);
      alert(error.message || "Failed to save offer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6">
        {offer ? "Edit Offer" : "Create New Offer"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              placeholder="SUMMER2024"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Summer Special"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Offer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Offer Type *
          </label>
          <select
            value={formData.offer_type}
            onChange={(e) =>
              setFormData({ ...formData, offer_type: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="percentage_discount">Percentage Discount</option>
            <option value="fixed_amount">Fixed Amount Off</option>
            <option value="extended_trial">Extended Trial</option>
            <option value="free_upgrade">Free Tier Upgrade</option>
            <option value="referral_bonus">Referral Bonus</option>
          </select>
        </div>

        {/* Conditional Fields Based on Type */}
        {formData.offer_type === "percentage_discount" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Percentage Off (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.percentage_off}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  percentage_off: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.offer_type === "fixed_amount" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Off (₹)
            </label>
            <input
              type="number"
              min="0"
              value={formData.fixed_amount_off / 100}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fixed_amount_off: parseFloat(e.target.value) * 100,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.offer_type === "extended_trial" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extra Trial Days
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.extended_trial_days}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  extended_trial_days: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {formData.offer_type === "free_upgrade" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Free Months
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.free_months}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  free_months: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              value={formData.starts_at}
              onChange={(e) =>
                setFormData({ ...formData, starts_at: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={formData.ends_at}
              onChange={(e) =>
                setFormData({ ...formData, ends_at: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Usage Limits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usage Limit Type
          </label>
          <select
            value={formData.usage_limit_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                usage_limit_type: e.target.value as any,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="one_time">One-time per user</option>
            <option value="limited">Limited total uses</option>
            <option value="unlimited">Unlimited</option>
          </select>
        </div>

        {formData.usage_limit_type === "limited" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Total Uses
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_uses}
              onChange={(e) =>
                setFormData({ ...formData, max_uses: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) =>
                setFormData({ ...formData, is_featured: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Feature this offer (show prominently)
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : offer ? "Update Offer" : "Create Offer"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
