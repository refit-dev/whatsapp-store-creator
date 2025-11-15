import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { StoreSettingsFormTabbed } from "@/components/StoreSettingsFormTabbed";
import { LogoutButton } from "@/components/LogoutButton";
import Link from "next/link";
import { DashboardWrapper } from "@/components/DashboardWrapper";

export default async function StoreSettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1);

  const store = stores?.[0];

  return (
    <DashboardWrapper>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              {/* Top Navigation Bar */}
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-200">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium group"
                >
                  <svg
                    className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
                <LogoutButton />
              </div>

              {/* Page Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {store ? "⚙️ Store Settings" : "🚀 Create Your Store"}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  {store
                    ? "Manage your store details and settings"
                    : "Set up your WhatsApp micro-store in minutes"}
                </p>
              </div>
            </div>

            <StoreSettingsFormTabbed store={store} userId={user.id} />
          </div>
        </div>
      </main>
    </DashboardWrapper>
  );
}
