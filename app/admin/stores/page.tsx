import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { StoreReviewClient } from "./StoreReviewClient";

export default async function PendingStoresPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Get all pending stores with their products
  const { data: pendingStores, error } = await supabase
    .from("stores")
    .select("*")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending stores:", error);
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Pending Store Approvals
        </h1>
        <p className="mt-2 text-gray-600">
          Review and approve or reject stores before they go live
        </p>
      </div>

      {!pendingStores || pendingStores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            All Caught Up!
          </h2>
          <p className="text-gray-600">
            There are no stores pending approval at the moment.
          </p>
        </div>
      ) : (
        <StoreReviewClient initialStores={pendingStores} />
      )}
    </div>
  );
}
