"use client";

import { useEffect, useState } from "react";
import { VerificationStatus } from "./VerificationStatus";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function VerificationStatusClient() {
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Get current user and their store
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // If user exists, get their store
      if (user) {
        const { data: storeData } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at")
          .limit(1)
          .single();

        setStore(storeData);
      }

      setLoading(false);
    };

    getCurrentUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Fetch store for the new user
        const { data: storeData } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", session.user.id)
          .order("created_at")
          .limit(1)
          .single();

        setStore(storeData);
      } else {
        setStore(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if verification is needed
  const emailVerified = user.user_metadata?.email_verified || false;
  const mobileVerified = user.user_metadata?.mobile_verified || false;

  // Only show if verification is incomplete
  if (emailVerified && mobileVerified) {
    return null;
  }

  return <VerificationStatus user={user} store={store} />;
}
