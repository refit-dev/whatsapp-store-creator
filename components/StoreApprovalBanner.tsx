"use client";

import { Database } from "@/types/supabase";
import Link from "next/link";

type Store = Database["public"]["Tables"]["stores"]["Row"];

export function StoreApprovalBanner({ store }: { store: Store }) {
  if (store.approval_status === "approved") {
    return null; // Don't show anything if approved
  }

  if (store.approval_status === "rejected") {
    return (
      <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-3xl">❌</span>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Store Rejected
            </h3>
            <p className="text-red-800 mb-3">
              Unfortunately, your store has been rejected and cannot be accessed
              publicly.
            </p>
            {store.rejection_reason && (
              <div className="bg-white border border-red-200 rounded-lg p-4 mb-3">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Reason for Rejection:
                </p>
                <p className="text-sm text-gray-700">
                  {store.rejection_reason}
                </p>
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

  // Default: pending
  return (
    <div className="mb-6 bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-3xl">⏳</span>
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            Store Pending Approval
          </h3>
          <p className="text-orange-800 mb-3">
            Your store is currently under review by our team. This usually takes
            24-48 hours.
          </p>
          <div className="bg-white border border-orange-200 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-700">
              ✓ Your store has been submitted successfully
              <br />✓ We&apos;re reviewing your store details and products
              <br />✓ You&apos;ll receive an email once the review is complete
            </p>
          </div>
          <p className="text-sm text-orange-700">
            <strong>Note:</strong> Your store will not be publicly accessible
            until it&apos;s approved. You can still edit your store settings and
            add products while waiting.
          </p>
        </div>
      </div>
    </div>
  );
}
