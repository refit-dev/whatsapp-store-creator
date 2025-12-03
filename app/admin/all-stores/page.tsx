import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { AllStoresClient } from "./AllStoresClient";

export default async function AllStoresPage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: stores } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Stores</h1>
        <p className="mt-2 text-gray-600">
          View and moderate all stores on the platform
        </p>
      </div>

      {!stores || stores.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <span className="text-6xl mb-4 block">🏪</span>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Stores Yet
          </h2>
          <p className="text-gray-600">
            There are no stores on the platform yet.
          </p>
        </div>
      ) : (
        <AllStoresClient stores={stores} />
      )}
    </div>
  );
}
