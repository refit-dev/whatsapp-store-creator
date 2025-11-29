import { Metadata } from "next";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TrialSettingsManager from "@/components/TrialSettingsManager";
import SpecialOffersManager from "@/components/SpecialOffersManager";
import type { Database } from "@/types/supabase";
import { getBackofficeProfile } from "@/lib/backoffice";

export const metadata: Metadata = {
  title: "Trial & Offers Management | Admin Dashboard",
  description: "Manage trial periods and special offers",
};

export default async function TrialOffersPage() {
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/admin/trial-offers");
  }

  const backofficeProfile = await getBackofficeProfile(supabase, user.id);
  if (!backofficeProfile || backofficeProfile.role !== "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Trial & Offers Management
            </h1>
            <p className="text-xs text-gray-500">
              Configure trial settings and promotional offers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="space-y-4">
          <TrialSettingsManager />
          <SpecialOffersManager />
        </div>
      </div>
    </div>
  );
}
