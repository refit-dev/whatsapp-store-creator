import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { StoreReviewClient } from "./StoreReviewClient";

export default async function PendingStoresPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Redirect to all-stores page since stores are now auto-approved
  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store Approvals</h1>
        <p className="mt-2 text-gray-600">
          Stores are now automatically approved. Use the "Browse All Stores"
          page to moderate stores if needed.
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-3xl">ℹ️</span>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Auto-Approval Enabled
            </h3>
            <p className="text-blue-800 mb-3">
              All stores are now automatically approved upon creation. You can
              still moderate stores by blocking them if they violate policies.
            </p>
            <a
              href="/admin/all-stores"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Go to All Stores →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
