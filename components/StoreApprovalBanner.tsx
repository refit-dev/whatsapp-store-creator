"use client";

import { Database } from "@/types/supabase";
import Link from "next/link";

type Store = Database["public"]["Tables"]["stores"]["Row"];

export function StoreApprovalBanner({ store }: { store: Store }) {
  // Show banner only if store is blocked
  if (!store.is_blocked) {
    return null;
  }

  return (
    <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-3xl">🚫</span>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Store Blocked
          </h3>
          <p className="text-red-800 mb-3">
            Your store has been blocked and cannot be accessed publicly.
          </p>
          {store.block_reason && (
            <div className="bg-white border border-red-200 rounded-lg p-4 mb-3">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Reason for Block:
              </p>
              <p className="text-sm text-gray-700">{store.block_reason}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Link
              href="/dashboard/store"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
            >
              Update Store Details
            </Link>
            <a
              href="mailto:support@yourapp.com"
              className="inline-flex items-center px-4 py-2 bg-white text-red-600 border border-red-600 rounded-lg hover:bg-red-50 font-medium text-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
