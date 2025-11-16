/**
 * Login Attempt Tracking Utility
 * Prevents brute force attacks by limiting login attempts
 */

import { supabaseBrowser } from "./supabase-browser";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

interface LoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_time: string;
  success: boolean;
}

/**
 * Get client IP address and user agent
 */
function getClientInfo() {
  return {
    userAgent:
      typeof window !== "undefined" ? window.navigator.userAgent : null,
  };
}

/**
 * Check if an email is currently locked out
 * @param email - Email address to check
 * @returns Object with isLocked status and minutes remaining
 */
export async function checkLoginLock(email: string): Promise<{
  isLocked: boolean;
  remainingMinutes: number;
  attemptCount: number;
}> {
  const sb = supabaseBrowser();

  // Calculate the time threshold (15 minutes ago)
  const lockoutThreshold = new Date();
  lockoutThreshold.setMinutes(
    lockoutThreshold.getMinutes() - LOCKOUT_DURATION_MINUTES
  );

  try {
    // Get failed attempts within the lockout window
    const { data: attempts, error } = await sb
      .from("login_attempts")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("success", false)
      .gte("attempt_time", lockoutThreshold.toISOString())
      .order("attempt_time", { ascending: false });

    if (error) {
      console.error("Error checking login attempts:", error);
      // Fail open - don't block login if we can't check
      return { isLocked: false, remainingMinutes: 0, attemptCount: 0 };
    }

    const attemptCount = attempts?.length || 0;

    if (attemptCount >= MAX_ATTEMPTS) {
      // Calculate remaining lockout time
      const oldestRelevantAttempt = attempts[attempts.length - 1];
      const attemptTime = new Date(oldestRelevantAttempt.attempt_time);
      const unlockTime = new Date(attemptTime);
      unlockTime.setMinutes(unlockTime.getMinutes() + LOCKOUT_DURATION_MINUTES);

      const now = new Date();
      const remainingMs = unlockTime.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

      return {
        isLocked: remainingMinutes > 0,
        remainingMinutes: Math.max(0, remainingMinutes),
        attemptCount,
      };
    }

    return { isLocked: false, remainingMinutes: 0, attemptCount };
  } catch (error) {
    console.error("Error in checkLoginLock:", error);
    // Fail open
    return { isLocked: false, remainingMinutes: 0, attemptCount: 0 };
  }
}

/**
 * Record a login attempt (success or failure)
 * @param email - Email address used in attempt
 * @param success - Whether the login was successful
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean
): Promise<void> {
  const sb = supabaseBrowser();
  const clientInfo = getClientInfo();

  try {
    const { error } = await sb.from("login_attempts").insert({
      email: email.toLowerCase(),
      ip_address: null, // IP tracking would need server-side implementation
      user_agent: clientInfo.userAgent,
      success,
      attempt_time: new Date().toISOString(),
    });

    if (error) {
      console.error("Error recording login attempt:", error);
    }

    // If successful login, clear old failed attempts for this email
    if (success) {
      await clearFailedAttempts(email);
    }
  } catch (error) {
    console.error("Error in recordLoginAttempt:", error);
  }
}

/**
 * Clear failed login attempts for an email after successful login
 * @param email - Email address to clear attempts for
 */
async function clearFailedAttempts(email: string): Promise<void> {
  const sb = supabaseBrowser();

  try {
    const { error } = await sb
      .from("login_attempts")
      .delete()
      .eq("email", email.toLowerCase())
      .eq("success", false);

    if (error) {
      console.error("Error clearing failed attempts:", error);
    }
  } catch (error) {
    console.error("Error in clearFailedAttempts:", error);
  }
}

/**
 * Get remaining attempts before lockout
 * @param email - Email address to check
 * @returns Number of attempts remaining
 */
export async function getRemainingAttempts(email: string): Promise<number> {
  const { attemptCount } = await checkLoginLock(email);
  return Math.max(0, MAX_ATTEMPTS - attemptCount);
}

/**
 * Format lockout message for display
 * @param remainingMinutes - Minutes until unlock
 * @returns Formatted message string
 */
export function formatLockoutMessage(remainingMinutes: number): string {
  if (remainingMinutes <= 0) {
    return "Too many failed login attempts. Please try again.";
  }

  if (remainingMinutes === 1) {
    return "Account temporarily locked. Please try again in 1 minute.";
  }

  return `Account temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minutes.`;
}
