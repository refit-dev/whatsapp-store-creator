"use client";

import { useState } from "react";
import Link from "next/link";

type ImageReview = {
  id: string;
  product_id: string;
  store_id: string;
  image_url: string;
  review_status: "pending" | "approved" | "flagged" | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  flag_reason: string | null;
  created_at: string | null;
  products: { id: string; title: string } | null;
  stores: { id: string; name: string; handle: string } | null;
};

export function ImageReviewClient({
  initialReviews,
}: {
  initialReviews: ImageReview[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<
    "all" | "pending" | "flagged" | "approved"
  >("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "all") return true;
    return r.review_status === filter;
  });

  const handleApprove = async (review: ImageReview) => {
    setProcessingId(review.id);
    try {
      const response = await fetch("/api/admin/review-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          action: "approve",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve image");

      setReviews(
        reviews.map((r) =>
          r.id === review.id
            ? {
                ...r,
                review_status: "approved" as const,
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (error) {
      alert("Failed to approve image");
    } finally {
      setProcessingId(null);
    }
  };

  const handleFlag = async (review: ImageReview) => {
    const reason = prompt("Why are you flagging this image?");
    if (!reason) return;

    setProcessingId(review.id);
    try {
      const response = await fetch("/api/admin/review-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review.id,
          action: "flag",
          flagReason: reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to flag image");

      setReviews(
        reviews.map((r) =>
          r.id === review.id
            ? {
                ...r,
                review_status: "flagged" as const,
                flag_reason: reason,
                reviewed_at: new Date().toISOString(),
              }
            : r
        )
      );
    } catch (error) {
      alert("Failed to flag image");
    } finally {
      setProcessingId(null);
    }
  };

  const handleBlockStore = async (review: ImageReview) => {
    const reason = prompt(
      `Block store "${review.stores?.name}"? Provide a reason:`
    );
    if (!reason) return;

    if (
      !confirm(
        `Are you sure you want to BLOCK this entire store? This will make it inaccessible to customers.`
      )
    ) {
      return;
    }

    setProcessingId(review.id);
    try {
      const response = await fetch("/api/admin/block-store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: review.store_id,
          blockReason: reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to block store");

      alert(`Store "${review.stores?.name}" has been blocked`);
      // Optionally remove all images from this store from the list
      setReviews(reviews.filter((r) => r.store_id !== review.store_id));
    } catch (error) {
      alert("Failed to block store");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              {
                key: "pending",
                label: "Pending",
                count: reviews.filter((r) => r.review_status === "pending")
                  .length,
              },
              {
                key: "flagged",
                label: "Flagged",
                count: reviews.filter((r) => r.review_status === "flagged")
                  .length,
              },
              {
                key: "approved",
                label: "Approved",
                count: reviews.filter((r) => r.review_status === "approved")
                  .length,
              },
              { key: "all", label: "All", count: reviews.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              <img
                src={review.image_url}
                alt="Product"
                className="w-full h-full object-cover"
              />
              {review.review_status === "flagged" && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                  🚩 FLAGGED
                </div>
              )}
              {review.review_status === "approved" && (
                <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                  ✅ APPROVED
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                {review.products?.title || "Unknown Product"}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Store:{" "}
                <Link
                  href={`/${review.stores?.handle}`}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {review.stores?.name}
                </Link>
              </p>
              {review.flag_reason && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                  <p className="text-red-800 font-medium">Flagged:</p>
                  <p className="text-red-700">{review.flag_reason}</p>
                </div>
              )}
              <p className="text-xs text-gray-500 mb-3">
                Uploaded:{" "}
                {review.created_at
                  ? new Date(review.created_at).toLocaleString()
                  : "Unknown"}
              </p>

              {/* Actions */}
              {review.review_status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(review)}
                    disabled={processingId === review.id}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleFlag(review)}
                    disabled={processingId === review.id}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                  >
                    🚩 Flag
                  </button>
                </div>
              )}

              {review.review_status === "flagged" && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleApprove(review)}
                    disabled={processingId === review.id}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                  >
                    ✅ Approve Anyway
                  </button>
                  <button
                    onClick={() => handleBlockStore(review)}
                    disabled={processingId === review.id}
                    className="w-full px-3 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 text-sm font-medium"
                  >
                    🚫 Block Store
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No {filter !== "all" && filter} images to review
        </div>
      )}
    </div>
  );
}
