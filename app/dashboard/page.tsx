import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import { toLocaleString } from "@/lib/currency";
import type { Store, Order } from "@/types/interfaces";
import type { Database } from "@/types/supabase";
import Link from "next/link";
import { ShareStoreLink } from "@/components/ShareStoreLink";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  let { data: stores } = await supabase
    .from('stores')
    .select('*, orders(*)')
    .order('created_at');

  // Auto-create store if user doesn't have one
  if (!stores || stores.length === 0) {
    const handle = `store-${user.id.substring(0, 8)}`;
    
    type StoreInsert = Database['public']['Tables']['stores']['Insert'];
    const storeData: StoreInsert = {
      owner_id: user.id,
      handle,
      name: 'My Store',
      whatsapp_e164: '',
      currency: 'USD',
    };

    const { data: newStore } = await supabase
      .from('stores')
      .insert(storeData)
      .select()
      .single();

    if (newStore) {
      // Add user as store owner
      type MemberInsert = Database['public']['Tables']['store_members']['Insert'];
      await supabase.from('store_members').insert({
        store_id: newStore.id,
        user_id: user.id,
        role: 'owner',
      });

      // Fetch again to get the store with orders
      const { data: refreshedStores } = await supabase
        .from('stores')
        .select('*, orders(*)')
        .eq('id', newStore.id);
      
      stores = refreshedStores || [];
    }
  }

  const store = stores?.[0] as Store | undefined;
  const orders = (store?.orders as Order[]) || [];

  // If user has no store, show onboarding
  if (!store) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to WhatsApp Micro-Store! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Let's create your first store. It takes just a minute!
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-3 text-gray-900">What happens next:</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">1</span>
                  <span>Create your store with a unique handle and WhatsApp number</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">2</span>
                  <span>Add products with photos, prices, and descriptions</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">3</span>
                  <span>Share your store link with customers</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 mt-0.5">4</span>
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
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with Store Info and Share Link */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600 mt-1">Dashboard Overview</p>
            </div>
            <ShareStoreLink handle={store.handle} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title="Total Orders"
            value={orders.length.toString()}
            icon="📦"
            color="blue"
          />
          <StatsCard
            title="Paid Orders"
            value={orders.filter(o => o.status === 'paid').length.toString()}
            icon="✅"
            color="green"
          />
          <StatsCard
            title="Total Revenue"
            value={toLocaleString(
              orders.reduce((sum, o) => sum + (o.total_cents || 0), 0) / 100,
              store.currency || "USD"
            )}
            icon="💰"
            color="purple"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${orders.length > 0 ? Math.round(
              (orders.filter(o => o.status === 'paid').length / orders.length) * 100
            ) : 0}%`}
            icon="📊"
            color="orange"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Recent Orders</h2>
          
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-2">No orders yet</p>
              <p className="text-gray-500">Share your store link to start receiving orders!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map(order => (
                <div key={order.id} className="border border-gray-200 p-4 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{order.buyer_name}</p>
                      <p className="text-sm text-gray-600">{order.buyer_phone}</p>
                      <p className="text-sm text-gray-500 mt-1">{order.buyer_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {toLocaleString(order.total_cents / 100, store.currency || "USD")}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                        order.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : order.status === 'opened_whatsapp'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string; 
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
  icon
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
      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
