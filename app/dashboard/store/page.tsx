import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { StoreSettingsForm } from "@/components/StoreSettingsForm";

export default async function StoreSettingsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/auth");
  }

  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1);

  const store = stores?.[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {store ? 'Store Settings' : 'Create Your Store'}
            </h1>
            <p className="text-gray-600">
              {store 
                ? 'Manage your store details and settings' 
                : 'Set up your WhatsApp micro-store in minutes'
              }
            </p>
          </div>

          <StoreSettingsForm store={store} userId={user.id} />
        </div>
      </div>
    </main>
  );
}
