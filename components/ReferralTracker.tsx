"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

const STORAGE_KEY = "pending-referral-code";
const COOKIE_NAME = "referral_code";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const cookieString = document.cookie || "";
  const cookies = cookieString.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(`${name}=`)) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return null;
}

function persistReferralCode(code: string) {
  if (typeof window === "undefined") return;
  const normalized = code.trim();
  if (!normalized) return;
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    normalized
  )}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function clearStoredReferralCode() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

async function processReferralIfNeeded(
  referralCode: string,
  isAlreadyProcessing: MutableRefObject<boolean>
) {
  if (!referralCode || isAlreadyProcessing.current) return;

  const sb = supabaseBrowser();
  const {
    data: { session },
  } = await sb.auth.getSession();

  if (!session) return;

  isAlreadyProcessing.current = true;
  try {
    const response = await fetch("/api/referral/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode }),
    });

    // If processed (or code invalid/self-used), clear stored code to avoid loops
    if (response.ok || response.status === 400) {
      clearStoredReferralCode();
    }
  } catch (error) {
    console.error("Referral processing failed:", error);
  } finally {
    isAlreadyProcessing.current = false;
  }
}

/**
 * Captures ?ref= codes and automatically processes them once the user signs up/logs in.
 * This prevents referral codes from being lost during the redirect to the auth page.
 */
export function ReferralTracker() {
  const processing = useRef(false);

  // Capture referral code from URL or cookie and persist it
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("ref");
    const cookieCode = getCookieValue(COOKIE_NAME);
    const storedCode =
      urlCode || cookieCode || localStorage.getItem(STORAGE_KEY) || "";

    if (storedCode) {
      persistReferralCode(storedCode);
    }
  }, []);

  // When the user authenticates, process the stored referral code
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sb = supabaseBrowser();

    const attemptProcess = async () => {
      const pendingCode = localStorage.getItem(STORAGE_KEY) || "";
      if (!pendingCode) return;
      await processReferralIfNeeded(pendingCode, processing);
    };

    // Try immediately in case the user is already logged in
    attemptProcess();

    // Listen for auth state changes (sign-up/login)
    const { data: authListener } = sb.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          attemptProcess();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return null;
}
