/**
 * Cookie Consent Management
 * Handles GDPR-compliant cookie consent preferences
 */

export type CookieCategory = "essential" | "analytics" | "marketing";

export interface CookieConsent {
  essential: boolean; // Always true, required for site functionality
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string; // Policy version
}

const CONSENT_VERSION = "1.0";
const CONSENT_STORAGE_KEY = "whatsapp-store-cookie-consent";

/**
 * Get current cookie consent preferences
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as CookieConsent;

    // Check if consent is for current policy version
    if (consent.version !== CONSENT_VERSION) {
      return null; // Require new consent if policy changed
    }

    return consent;
  } catch (error) {
    console.error("Error reading cookie consent:", error);
    return null;
  }
}

/**
 * Save cookie consent preferences
 */
export function saveCookieConsent(
  preferences: Omit<CookieConsent, "timestamp" | "version">
): void {
  if (typeof window === "undefined") return;

  const consent: CookieConsent = {
    ...preferences,
    essential: true, // Always true
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));

    // Dispatch custom event so other components can react
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: consent })
    );

    // Apply consent immediately
    applyCookieConsent(consent);
  } catch (error) {
    console.error("Error saving cookie consent:", error);
  }
}

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Check if specific category is allowed
 */
export function isCategoryAllowed(category: CookieCategory): boolean {
  const consent = getCookieConsent();
  if (!consent) return false;
  return consent[category] === true;
}

/**
 * Apply consent preferences (enable/disable tracking scripts)
 */
function applyCookieConsent(consent: CookieConsent): void {
  // Analytics (Google Analytics, Plausible, etc.)
  if (consent.analytics) {
    enableAnalytics();
  } else {
    disableAnalytics();
  }

  // Marketing (Facebook Pixel, Google Ads, etc.)
  if (consent.marketing) {
    enableMarketing();
  } else {
    disableMarketing();
  }
}

/**
 * Enable analytics tracking
 */
function enableAnalytics(): void {
  if (typeof window === "undefined") return;

  // Example: Google Analytics
  // window.gtag?.('consent', 'update', {
  //   analytics_storage: 'granted',
  // });

  console.log("Analytics tracking enabled");
}

/**
 * Disable analytics tracking
 */
function disableAnalytics(): void {
  if (typeof window === "undefined") return;

  // Example: Google Analytics
  // window.gtag?.('consent', 'update', {
  //   analytics_storage: 'denied',
  // });

  console.log("Analytics tracking disabled");
}

/**
 * Enable marketing tracking
 */
function enableMarketing(): void {
  if (typeof window === "undefined") return;

  // Example: Facebook Pixel
  // window.fbq?.('consent', 'grant');

  console.log("Marketing tracking enabled");
}

/**
 * Disable marketing tracking
 */
function disableMarketing(): void {
  if (typeof window === "undefined") return;

  // Example: Facebook Pixel
  // window.fbq?.('consent', 'revoke');

  console.log("Marketing tracking disabled");
}

/**
 * Reset consent (for testing or when user wants to change preferences)
 */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.dispatchEvent(
    new CustomEvent("cookieConsentChanged", { detail: null })
  );
}

/**
 * Accept all cookies
 */
export function acceptAllCookies(): void {
  saveCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Reject non-essential cookies
 */
export function rejectNonEssential(): void {
  saveCookieConsent({
    essential: true,
    analytics: false,
    marketing: false,
  });
}
