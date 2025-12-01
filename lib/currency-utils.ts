/**
 * Currency utilities for multi-currency display
 * All payments are processed in INR, this is just for display
 */

export type Currency = "INR" | "USD";

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from INR
}

// Currency configurations
export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    name: "Indian Rupee",
    rate: 1, // Base currency
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rate: 0.012, // 1 INR = 0.012 USD (approximately)
  },
};

// Detect user's preferred currency based on country
export async function detectUserCurrency(): Promise<Currency> {
  try {
    // Try to get user's country from IP
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: {
        "User-Agent": "WhatsApp Store Creator/1.0",
      },
    });

    if (response.ok) {
      const data = await response.json();
      const countryCode = data.country_code;

      // Return INR for India, USD for others
      return countryCode === "IN" ? "INR" : "USD";
    }
  } catch (error) {
    console.log("Currency detection failed, using default:", error);
  }

  // Fallback to browser locale detection
  const locale = navigator.language || navigator.languages?.[0];
  if (locale && locale.startsWith("en-IN")) {
    return "INR";
  }

  // Default to INR for safety (existing users)
  return "INR";
}

// Convert price from INR to target currency
export function convertPrice(
  priceInINR: number,
  targetCurrency: Currency
): number {
  const config = CURRENCIES[targetCurrency];
  const convertedPrice = priceInINR * config.rate;

  // Round to appropriate decimal places
  if (targetCurrency === "USD") {
    return Math.round(convertedPrice * 100) / 100; // 2 decimal places
  }

  return Math.round(convertedPrice); // Whole numbers for INR
}

// Format price with currency symbol
export function formatPrice(priceInINR: number, currency: Currency): string {
  const config = CURRENCIES[currency];
  const convertedPrice = convertPrice(priceInINR, currency);

  if (currency === "USD") {
    return `${config.symbol}${convertedPrice.toFixed(2)}`;
  }

  return `${config.symbol}${convertedPrice.toLocaleString("en-IN")}`;
}

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol;
}

// Common price points in INR (base prices)
export const PRICING = {
  MONTHLY_INR: 9900, // ₹99 in cents
  YEARLY_INR: 99900, // ₹999 in cents
  TRIAL_INR: 0, // Free trial
};

// Format subscription prices
export function formatSubscriptionPrice(currency: Currency): {
  monthly: string;
  yearly: string;
  monthlyRaw: number;
  yearlyRaw: number;
} {
  const monthlyInINR = PRICING.MONTHLY_INR / 100; // Convert cents to rupees
  const yearlyInINR = PRICING.YEARLY_INR / 100;

  return {
    monthly: formatPrice(monthlyInINR, currency),
    yearly: formatPrice(yearlyInINR, currency),
    monthlyRaw: convertPrice(monthlyInINR, currency),
    yearlyRaw: convertPrice(yearlyInINR, currency),
  };
}
