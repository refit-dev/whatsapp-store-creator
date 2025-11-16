import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { ImageReviewClient } from "./ImageReviewClient";

export default async function ImageReviewPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Get all image reviews with product and store info
  const { data: imageReviews } = await supabase
    .from("image_reviews")
    .select(
      `
      *,
      products (
        id,
        title
      ),
      stores (
        id,
        name,
        handle
      )
    `
    )
    .order("created_at", { ascending: false });

  const pendingCount =
    imageReviews?.filter((r) => r.review_status === "pending").length || 0;
  const flaggedCount =
    imageReviews?.filter((r) => r.review_status === "flagged").length || 0;
  const approvedCount =
    imageReviews?.filter((r) => r.review_status === "approved").length || 0;

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Image Moderation</h1>
        <p className="mt-2 text-gray-600">
          Review product images for policy violations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">
                Pending Review
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {pendingCount}
              </p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Flagged</p>
              <p className="text-2xl font-bold text-red-900">{flaggedCount}</p>
            </div>
            <span className="text-3xl">🚩</span>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {approvedCount}
              </p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </div>
      </div>

      {!imageReviews || imageReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">🖼️</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Images to Review
          </h2>
          <p className="text-gray-600">
            Product images will appear here when stores upload them.
          </p>
        </div>
      ) : (
        <ImageReviewClient initialReviews={imageReviews as any} />
      )}
    </div>
  );
}
