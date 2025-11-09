"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type SubscriptionStatus = "trial" | "active" | "expired" | "none";

interface UserSubscription {
  id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  is_trial: boolean;
  plan: {
    name: string;
    price_cents: number;
    duration_days: number;
  };
}

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  status: SubscriptionStatus;
  daysRemaining: number;
  isLoading: boolean;
  referralCode: string | null;
  referralCount: number;
  maxReferrals: number;
  remainingReferrals: number;
  hasReachedReferralLimit: boolean;
  refreshSubscription: (force?: boolean) => Promise<void>;
  createReferralCode: () => Promise<string | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [maxReferrals] = useState(6); // Maximum 6 months free through referrals
  const [remainingReferrals, setRemainingReferrals] = useState(6);
  const [hasReachedReferralLimit, setHasReachedReferralLimit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const refreshSubscription = async (force = false) => {
    // Cache for 2 minutes to avoid excessive API calls
    const now = Date.now();
    const cacheTime = 2 * 60 * 1000; // 2 minutes

    if (!force && lastFetch && now - lastFetch < cacheTime) {
      // Use cached data if available and recent
      return;
    }

    // Try to load from sessionStorage first for faster initial load
    if (!force && !subscription) {
      try {
        const cached = sessionStorage.getItem("subscription-cache");
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (now - timestamp < cacheTime) {
            setSubscription(data.subscription);
            setReferralCode(data.referralCode);
            setReferralCount(data.referralCount);
            setRemainingReferrals(data.remainingReferrals);
            setHasReachedReferralLimit(data.hasReachedReferralLimit);
            setIsLoading(false);
            setLastFetch(timestamp);
            return;
          }
        }
      } catch (e) {
        // Ignore cache errors
      }
    }

    setIsLoading(true);
    try {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) {
        setSubscription(null);
        setReferralCode(null);
        setReferralCount(0);
        setRemainingReferrals(maxReferrals);
        setHasReachedReferralLimit(false);
        // Clear cache when user logs out
        sessionStorage.removeItem("subscription-cache");
        return;
      }

      // Get active subscription
      const { data: subscriptions } = await sb
        .from("user_subscriptions")
        .select(
          `
          *,
          plan:subscription_plans(name, price_cents, duration_days)
        `
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("ends_at", { ascending: false })
        .limit(1);

      setSubscription(subscriptions?.[0] || null);

      // Get referral code
      const { data: referralCodes } = await sb
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .limit(1);

      setReferralCode(referralCodes?.[0]?.code || null);

      // Get referral count
      const { data: referrals } = await sb
        .from("referrals")
        .select("id")
        .eq("referrer_id", user.id);

      const currentReferralCount = referrals?.length || 0;
      const remaining = Math.max(0, maxReferrals - currentReferralCount);
      const limitReached = currentReferralCount >= maxReferrals;

      setReferralCount(currentReferralCount);
      setRemainingReferrals(remaining);
      setHasReachedReferralLimit(limitReached);
      setLastFetch(now);

      // Cache the data in sessionStorage for faster subsequent loads
      try {
        const cacheData = {
          subscription: subscriptions?.[0] || null,
          referralCode: referralCodes?.[0]?.code || null,
          referralCount: currentReferralCount,
          remainingReferrals: remaining,
          hasReachedReferralLimit: limitReached,
        };
        sessionStorage.setItem(
          "subscription-cache",
          JSON.stringify({
            data: cacheData,
            timestamp: now,
          })
        );
      } catch (e) {
        // Ignore storage errors
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createReferralCode = async (): Promise<string | null> => {
    try {
      const sb = supabaseBrowser();
      const {
        data: { user },
      } = await sb.auth.getUser();

      if (!user) return null;

      const { data, error } = await sb.rpc("create_user_referral_code", {
        user_uuid: user.id,
      });

      if (error) throw error;

      const newCode = data as string;
      setReferralCode(newCode);
      return newCode;
    } catch (error) {
      console.error("Error creating referral code:", error);
      return null;
    }
  };

  const getStatus = (): SubscriptionStatus => {
    if (!subscription) return "none";

    const now = new Date();
    const endDate = new Date(subscription.ends_at);

    if (endDate < now) return "expired";
    if (subscription.is_trial) return "trial";
    return "active";
  };

  const getDaysRemaining = (): number => {
    if (!subscription) return 0;

    const now = new Date();
    const endDate = new Date(subscription.ends_at);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  useEffect(() => {
    // Initial load with cache check
    refreshSubscription();

    // Set up periodic refresh every 5 minutes (less frequent)
    const interval = setInterval(() => {
      refreshSubscription(); // This will use cache if recent
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []); // Empty dependency array to run only once

  const value: SubscriptionContextType = {
    subscription,
    status: getStatus(),
    daysRemaining: getDaysRemaining(),
    isLoading,
    referralCode,
    referralCount,
    maxReferrals,
    remainingReferrals,
    hasReachedReferralLimit,
    refreshSubscription,
    createReferralCode,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }
  return context;
}
