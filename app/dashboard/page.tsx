import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { toLocaleString } from "@/lib/currency";
import type { Store, Order } from "@/types/interfaces";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { ShareStoreLink } from "@/components/ShareStoreLink";
import { SubscriptionProvider } from "@/components/SubscriptionProvider";
import { ReferralBanner } from "@/components/ReferralBanner";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { LogoutButton } from "@/components/LogoutButton";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { StoreApprovalBanner } from "@/components/StoreApprovalBanner";

// Force no caching for this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Check if user is an admin - if so, redirect to admin panel
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  console.log("=== ADMIN CHECK ===");
  console.log("User ID:", user.id);
  console.log("Admin Data:", adminData);
  console.log("Admin Error:", adminError);
  console.log("==================");

  if (adminData) {
    console.log("Redirecting to admin panel");
    redirect("/admin");
  }

  // Get user's store first
  let { data: stores } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at");

  // Auto-create store if user doesn't have one
  if (!stores || stores.length === 0) {
    const handle = `store-${user.id.substring(0, 8)}`;

    // Get mobile number from user metadata if available
    const mobileNumber = user.user_metadata?.mobile_number || "";

    type StoreInsert = Database["public"]["Tables"]["stores"]["Insert"];
    const storeData: StoreInsert = {
      owner_id: user.id,
      handle,
      name: "My Store",
      whatsapp_e164: mobileNumber,
      currency: "INR", // Default to INR since most users will be Indian based on mobile number format
    };

    const { data: newStore } = await supabase
      .from("stores")
      .insert(storeData)
      .select()
      .single();

    if (newStore) {
      // Add user as store owner
      type MemberInsert =
        Database["public"]["Tables"]["store_members"]["Insert"];
      await supabase.from("store_members").insert({
        store_id: newStore.id,
        user_id: user.id,
        role: "owner",
      });

      stores = [newStore];
    }
  }

  const store = stores?.[0] as Store | undefined;

  // Get orders separately using the same method as orders page
  let orders: Order[] = [];
  if (store) {
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    orders = (ordersData as Order[]) || [];
  }

  // If user has no store, show onboarding
  if (!store) {
    return (
      <DashboardWrapper>
        <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to watzy! 🎉
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Let's create your first store. It takes just a minute!
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="font-semibold text-lg mb-3 text-gray-900">
                  What happens next:
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                      1
                    </span>
                    <span>
                      Create your store with a unique handle and WhatsApp number
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                      2
                    </span>
                    <span>
                      Add products with photos, prices, and descriptions
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                      3
                    </span>
                    <span>Share your store link with customers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">
                      4
                    </span>
                    <span>Receive orders directly in WhatsApp</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard/store"
                className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Create Your Store →
              </Link>
            </div>
          </div>
        </main>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {/* Subscription Status and Referral Banner */}
          <div className="mb-6 space-y-4">
            <SubscriptionStatus />
            <ReferralBanner />
          </div>

          {/* Store Approval Status Banner */}
          <StoreApprovalBanner store={store} />

          {/* Header with Store Info and Share Link */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {store.name}
                </h1>
                <p className="text-gray-600 mt-1">Dashboard Overview</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href={`/${store.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm touch-target"
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
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View Store
                </Link>
                <ShareStoreLink handle={store.handle} storeId={store.id} />
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-4">
            <StatsCard
              title="Total Orders"
              value={orders.length.toString()}
              icon="📦"
              color="blue"
              href="/dashboard/orders"
            />
            <StatsCard
              title="Paid Orders"
              value={orders
                .filter((o) => o.status === "paid")
                .length.toString()}
              icon="✅"
              color="green"
              href="/dashboard/orders"
            />
            <StatsCard
              title="Total Revenue"
              value={toLocaleString(
                orders.reduce((sum, o) => sum + (o.total_cents || 0), 0),
                store.currency || "USD"
              )}
              icon="💰"
              color="purple"
              href="/dashboard/orders"
            />
            <StatsCard
              title="Conversion Rate"
              value={`${
                orders.length > 0
                  ? Math.round(
                      (orders.filter((o) => o.status === "paid").length /
                        orders.length) *
                        100
                    )
                  : 0
              }%`}
              icon="📊"
              color="orange"
              href="/dashboard/orders"
            />
          </div>

          {/* Conversion Rate Info */}
          <div className="bg-blue-50 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-700">
                Conversion Rate:
              </span>{" "}
              Percentage of orders that are paid.{" "}
              <span className="text-gray-500">
                Formula: (Paid Orders ÷ Total Orders) × 100
              </span>
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
            <QuickLink
              href="/dashboard/products"
              title="Manage Products"
              description="Add, edit, or remove products from your store"
              icon="🛍️"
            />
            <QuickLink
              href="/dashboard/orders"
              title="View Orders"
              description="Track and manage customer orders"
              icon="📋"
            />
            <QuickLink
              href="/dashboard/store"
              title="Store Settings"
              description="Update your store info and payment settings"
              icon="⚙️"
            />
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Recent Orders
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg mb-2">No orders yet</p>
                <p className="text-gray-500">
                  Share your store link to start receiving orders!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="border border-gray-200 p-4 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {order.buyer_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.buyer_phone}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.buyer_address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {toLocaleString(
                            order.total_cents || 0,
                            store.currency || "USD"
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : ""}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                            order.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : order.status === "opened_whatsapp"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Need help with your store?
            </p>
            <Link
              href="/dashboard/contact-us"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contact Us
            </Link>
          </div>
        </div>
      </main>
    </DashboardWrapper>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
  href: string;
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <Link
      href={href}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md hover:shadow-xl p-6 text-white transition-all transform hover:scale-105 cursor-pointer group block`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-90 group-hover:opacity-100 transition-opacity">
          {title}
        </h3>
        <span className="text-2xl group-hover:scale-110 transition-transform">
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold group-hover:text-4xl transition-all">
        {value}
      </p>
      <div className="mt-2 text-xs opacity-0 group-hover:opacity-90 transition-opacity">
        Click to view details →
      </div>
    </Link>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
