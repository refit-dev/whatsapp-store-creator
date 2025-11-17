import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import Link from "next/link";

export default async function AdminDashboard() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  // Get stats
  const { data: stores } = await supabase.from("stores").select("*");

  const pendingCount =
    stores?.filter((s) => s.approval_status === "pending").length || 0;
  const approvedCount =
    stores?.filter((s) => s.approval_status === "approved").length || 0;
  const rejectedCount =
    stores?.filter((s) => s.approval_status === "rejected").length || 0;
  const totalStores = stores?.length || 0;

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage store approvals and view platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stores</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalStores}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">🏪</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Pending Review
              </p>
              <p className="mt-2 text-3xl font-bold text-orange-600">
                {pendingCount}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <Link
            href="/admin/stores"
            className="mt-4 text-sm text-orange-600 hover:text-orange-800 font-medium"
          >
            Review now →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {approvedCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {rejectedCount}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <span className="text-2xl">❌</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Store Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/stores"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">
                Review Pending Stores
              </h3>
              <p className="text-sm text-gray-600">
                {pendingCount} store{pendingCount !== 1 ? "s" : ""} waiting for
                approval
              </p>
            </div>
            <span className="text-2xl">👀</span>
          </Link>

          <Link
            href="/admin/all-stores"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">View All Stores</h3>
              <p className="text-sm text-gray-600">
                Browse all stores on the platform
              </p>
            </div>
            <span className="text-2xl">📋</span>
          </Link>

          <Link
            href="/admin/images"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">Image Moderation</h3>
              <p className="text-sm text-gray-600">
                Review uploaded product images
              </p>
            </div>
            <span className="text-2xl">🖼️</span>
          </Link>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🔒 Security & Monitoring
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/security/virus-scans"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">Virus Scans</h3>
              <p className="text-sm text-gray-600">Monitor malware detection</p>
            </div>
            <span className="text-2xl">🛡️</span>
          </Link>

          <Link
            href="/admin/security/test"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:shadow-md transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">Security Test</h3>
              <p className="text-sm text-gray-600">
                Verify security configuration
              </p>
            </div>
            <span className="text-2xl">🧪</span>
          </Link>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div>
              <h3 className="font-medium text-gray-900">File Protection</h3>
              <p className="text-sm text-gray-600">
                Multi-layer security active
              </p>
            </div>
            <span className="text-2xl">✅</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stores && stores.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Stores
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stores.slice(0, 5).map((store) => (
                  <tr key={store.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {store.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        @{store.handle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.approval_status === "approved"
                            ? "bg-green-100 text-green-800"
                            : store.approval_status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {store.approval_status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {store.created_at
                        ? new Date(store.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
