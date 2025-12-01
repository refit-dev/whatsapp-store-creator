"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";

export default function TestSubscriptionPage() {
  const [user, setUser] = useState<any>(null);
  const [authError, setAuthError] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any>(null);
  const [subError, setSubError] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const sb = supabaseBrowser();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await sb.auth.getUser();
      setUser(user);
      setAuthError(authError);

      if (authError || !user) {
        setLoading(false);
        return;
      }

      // Try to fetch subscription
      const { data: subscriptions, error: subError } = await sb
        .from("user_subscriptions")
        .select(
          `
          *,
          plan:subscription_plans(name, price_cents, duration_days)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active");

      setSubscriptions(subscriptions);
      setSubError(subError);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (authError || !user) {
    return <div className="p-8">Not logged in: {authError?.message}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Subscription Debug</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">User Info:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">Subscription Query Result:</h2>
        <pre>{JSON.stringify({ subscriptions, subError }, null, 2)}</pre>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">Subscriptions Found:</h2>
        <p>{subscriptions?.length || 0} subscription(s)</p>
        {subscriptions && subscriptions.length > 0 && (
          <pre>{JSON.stringify(subscriptions[0], null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
