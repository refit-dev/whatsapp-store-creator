/**
 * Input Sanitization Utility
 *
 * Prevents XSS, script injection, and other malicious input attacks
 * All user input should be sanitized before storage or display
 */

/**
 * Sanitize HTML - removes all HTML tags and dangerous content
 * Use for text that should never contain HTML
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  return (
    String(input)
      // Remove HTML tags
      .replace(/<[^>]*>/g, "")
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
      .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
      // Remove javascript: protocol
      .replace(/javascript:/gi, "")
      // Remove data: protocol (can be used for XSS)
      .replace(/data:text\/html/gi, "")
      // Trim whitespace
      .trim()
  );
}

/**
 * Sanitize URL - ensures URL is safe
 * Blocks javascript:, data:, and other dangerous protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  const urlString = String(url).trim();

  // Check for dangerous protocols
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "about:",
  ];

  const lowerUrl = urlString.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return "";
    }
  }

  // Only allow http, https, mailto, tel
  if (urlString.match(/^[a-zA-Z]+:/)) {
    if (!urlString.match(/^(https?|mailto|tel):/i)) {
      return "";
    }
  }

  return urlString;
}

/**
 * Sanitize email - validates and cleans email addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return "";

  const cleaned = String(email)
    .trim()
    .toLowerCase()
    // Remove any HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove spaces
    .replace(/\s/g, "");

  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleaned)) {
    return "";
  }

  return cleaned;
}

/**
 * Sanitize phone number - removes non-numeric characters
 * Preserves + for international format
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return "";

  return (
    String(phone)
      // Remove HTML
      .replace(/<[^>]*>/g, "")
      // Keep only numbers, +, -, (), and spaces
      .replace(/[^\d+\-\s()]/g, "")
      .trim()
  );
}

/**
 * Sanitize numeric input - ensures value is a valid number
 */
export function sanitizeNumber(
  value: string | number | null | undefined,
  options?: {
    min?: number;
    max?: number;
    integer?: boolean;
  }
): number {
  if (value === null || value === undefined || value === "") return 0;

  const num = Number(value);

  // Check if valid number
  if (isNaN(num) || !isFinite(num)) return 0;

  // Apply integer constraint
  let result = options?.integer ? Math.floor(num) : num;

  // Apply min/max constraints
  if (options?.min !== undefined) {
    result = Math.max(result, options.min);
  }
  if (options?.max !== undefined) {
    result = Math.min(result, options.max);
  }

  return result;
}

/**
 * Sanitize filename - removes dangerous characters
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return "";

  return (
    String(filename)
      // Remove path traversal attempts
      .replace(/\.\./g, "")
      .replace(/[\/\\]/g, "")
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, "")
      // Remove dangerous characters
      .replace(/[<>:"|?*]/g, "")
      .trim()
      .substring(0, 255)
  ); // Limit length
}

/**
 * Sanitize JSON input - safely parse and validate JSON
 */
export function sanitizeJSON<T = any>(
  input: string | null | undefined,
  defaultValue: T
): T {
  if (!input) return defaultValue;

  try {
    const parsed = JSON.parse(String(input));

    // Recursively sanitize strings in the object
    return sanitizeJSONValue(parsed);
  } catch {
    return defaultValue;
  }
}

function sanitizeJSONValue(value: any): any {
  if (typeof value === "string") {
    return sanitizeText(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeJSONValue);
  }

  if (value && typeof value === "object") {
    const sanitized: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = sanitizeJSONValue(value[key]);
      }
    }
    return sanitized;
  }

  return value;
}

/**
 * Sanitize SQL-like input - prevents SQL injection
 * Note: Always use parameterized queries, this is defense in depth
 */
export function sanitizeSQLInput(input: string | null | undefined): string {
  if (!input) return "";

  return (
    String(input)
      // Remove SQL comments
      .replace(/--/g, "")
      .replace(/\/\*/g, "")
      .replace(/\*\//g, "")
      // Remove semicolons (statement terminators)
      .replace(/;/g, "")
      // Remove SQL keywords that could be dangerous
      .replace(/\b(DROP|DELETE|TRUNCATE|EXEC|EXECUTE|UNION|INSERT)\b/gi, "")
      .trim()
  );
}

/**
 * Sanitize store handle - alphanumeric and hyphens only
 */
export function sanitizeHandle(handle: string | null | undefined): string {
  if (!handle) return "";

  return (
    String(handle)
      .toLowerCase()
      // Remove HTML
      .replace(/<[^>]*>/g, "")
      // Keep only alphanumeric and hyphens
      .replace(/[^a-z0-9-]/g, "")
      // Remove multiple consecutive hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, "")
      .trim()
      .substring(0, 50)
  ); // Limit length
}

/**
 * Sanitize currency code - uppercase letters only, 3 characters
 */
export function sanitizeCurrency(currency: string | null | undefined): string {
  if (!currency) return "USD";

  const cleaned = String(currency)
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .substring(0, 3);

  // Common currency codes whitelist
  const validCurrencies = [
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AUD",
    "CAD",
    "JPY",
    "CNY",
    "CHF",
    "SEK",
    "NZD",
    "KRW",
    "SGD",
    "HKD",
    "NOK",
    "MXN",
    "BRL",
    "ZAR",
    "AED",
    "SAR",
  ];

  if (validCurrencies.includes(cleaned)) {
    return cleaned;
  }

  return "USD";
}

/**
 * Sanitize rich text - allows safe HTML tags only
 * Use for product descriptions that need basic formatting
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";

  const text = String(input);

  // Allowed tags for basic formatting
  const allowedTags = ["b", "i", "u", "strong", "em", "br", "p"];

  // Remove all tags except allowed ones
  let cleaned = text
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    // Remove style attributes
    .replace(/style\s*=\s*["'][^"']*["']/gi, "")
    // Remove javascript: and data: protocols
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, "")
    .replace(/src\s*=\s*["']data:[^"']*["']/gi, "");

  // Remove all tags except allowed ones
  cleaned = cleaned.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      return match.replace(/\s+\w+\s*=\s*["'][^"']*["']/g, ""); // Remove attributes
    }
    return "";
  });

  return cleaned.trim();
}

/**
 * Escape HTML entities - converts special characters to HTML entities
 * Use when displaying user content in HTML
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Validate and sanitize product data
 */
export function sanitizeProductData(data: any): any {
  return {
    title: sanitizeText(data.title).substring(0, 200),
    description: sanitizeRichText(data.description).substring(0, 2000),
    price_cents: sanitizeNumber(data.price_cents, { min: 0, integer: true }),
    currency: sanitizeCurrency(data.currency),
    image_urls: Array.isArray(data.image_urls)
      ? data.image_urls.map((url: string) => sanitizeUrl(url)).filter(Boolean)
      : [],
    is_active: Boolean(data.is_active),
  };
}

/**
 * Validate and sanitize store data
 */
export function sanitizeStoreData(data: any): any {
  return {
    name: sanitizeText(data.name).substring(0, 100),
    handle: sanitizeHandle(data.handle),
    whatsapp_e164: sanitizePhone(data.whatsapp_e164),
    currency: sanitizeCurrency(data.currency),
    logo_url: sanitizeUrl(data.logo_url),
    banner_url: sanitizeUrl(data.banner_url),
  };
}

/**
 * Validate and sanitize order data
 */
export function sanitizeOrderData(data: any): any {
  return {
    buyer_name: sanitizeText(data.buyer_name).substring(0, 100),
    buyer_phone: sanitizePhone(data.buyer_phone),
    buyer_address: sanitizeText(data.buyer_address).substring(0, 500),
    notes: sanitizeText(data.notes || "").substring(0, 1000),
  };
}

/**
 * Rate limiting key sanitization
 */
export function sanitizeRateLimitKey(key: string | null | undefined): string {
  if (!key) return "unknown";

  return String(key)
    .replace(/[^a-zA-Z0-9._:-]/g, "")
    .substring(0, 100);
}
