import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Database } from "@/types/supabase";
import { getBackofficeProfile } from "@/lib/backoffice";

export default async function AdminDashboard() {
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookies(),
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth?redirect=/admin");
  }

  const backofficeProfile = await getBackofficeProfile(supabase, user.id);
  if (!backofficeProfile) {
    redirect("/dashboard?error=not_authorized");
  }

  const isApprover = backofficeProfile.role === "approver";

  const { data: stores } = await supabase.from("stores").select("*");

  const blockedCount =
    stores?.filter((store) => store.is_blocked === true).length || 0;
  const activeCount =
    stores?.filter((store) => store.is_active === true && !store.is_blocked)
      .length || 0;
  const inactiveCount =
    stores?.filter((store) => store.is_active === false).length || 0;
  const totalStores = stores?.length || 0;

  // Get paid users count (users with active paid subscriptions)
  const { data: paidSubscriptions } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("status", "active")
    .eq("is_trial", false);

  const paidUsersCount = paidSubscriptions
    ? new Set(paidSubscriptions.map((s) => s.user_id)).size
    : 0;

  const quickActions: {
    href: string;
    title: string;
    description: string;
    highlight?: "primary";
  }[] = [
    {
      href: "/admin/images",
      title: "Moderate Images",
      description: "Review uploaded product images",
      highlight: "primary",
    },
    {
      href: "/admin/all-stores",
      title: "Browse All Stores",
      description: "View and moderate stores",
      highlight: "primary",
    },
  ];

  if (!isApprover) {
    quickActions.push(
      {
        href: "/admin/trial-offers",
        title: "Trial & Offers",
        description: "Manage onboarding incentives",
      },
      {
        href: "/admin/security/virus-scans",
        title: "Security Scans",
        description: "Monitor malware detection",
      },
      {
        href: "/admin/security/test",
        title: "Security Test",
        description: "Verify security configuration",
      }
    );
  }

  return (
    <div className="px-4 py-6 space-y-8">
      <div>
        <p className="text-sm text-gray-500 uppercase tracking-wide">
          {backofficeProfile.role === "approver" ? "Approver" : "Admin"}{" "}
          workspace
        </p>
        <h1 className="text-3xl font-bold text-gray-900">
          Moderation Dashboard
        </h1>
        <p className="mt-2 text-gray-600">
          Keep stores and images safe for customers. Signed in as{" "}
          {backofficeProfile.email}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Stores</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalStores}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Active Stores</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {activeCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Paid Users</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {paidUsersCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-gray-600">
            {inactiveCount}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Blocked</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{blockedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg transition-all hover:shadow-md hover:border-blue-500 ${
                action.highlight ? "bg-blue-50" : "bg-white"
              }`}
            >
              <div>
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
              <span className="text-xl text-blue-600">{"->"}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
