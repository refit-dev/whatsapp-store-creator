/**
 * Google Analytics Event Tracking Helper
 * Provides type-safe event tracking with parameters for conversion funnel analysis
 */

export type ConversionEvent =
  | "hero_cta_click"
  | "video_modal_open"
  | "video_play"
  | "video_25_percent"
  | "video_50_percent"
  | "video_75_percent"
  | "video_complete"
  | "demo_store_click"
  | "sticky_cta_click"
  | "signup_initiated";

export interface ConversionEventParams {
  button_location?: "hero" | "sticky" | "header" | "footer" | "video_modal";
  scroll_depth?: number;
  video_watch_time?: number;
  time_on_page?: number;
  device_type?: "mobile" | "tablet" | "desktop";
  user_status?: "logged_in" | "logged_out";
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track a conversion event with Google Analytics
 * @param eventName - The name of the conversion event
 * @param params - Optional parameters to include with the event
 */
export function trackConversion(
  eventName: ConversionEvent,
  params?: ConversionEventParams
): void {
  // Check if gtag is available (client-side only)
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  // Add device type automatically
  const deviceType = getDeviceType();

  // Add time on page automatically
  const timeOnPage = Math.floor(performance.now() / 1000);

  // Merge default params with provided params
  const eventParams: ConversionEventParams = {
    device_type: deviceType,
    time_on_page: timeOnPage,
    ...params,
  };

  // Send event to Google Analytics
  window.gtag("event", eventName, eventParams);

  // Log in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${eventName}`, eventParams);
  }
}

/**
 * Get the current device type based on screen width
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Calculate scroll depth percentage
 */
export function getScrollDepth(): number {
  if (typeof window === "undefined") return 0;

  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  const scrollDepth = ((scrollTop + windowHeight) / documentHeight) * 100;
  return Math.round(scrollDepth);
}

/**
 * Type declaration for gtag
 */
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}
