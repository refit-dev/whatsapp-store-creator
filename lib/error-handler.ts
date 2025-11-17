/**
 * Error Handling Utilities
 * Sanitizes error messages to prevent exposing system details to users
 * while logging full details server-side for debugging
 */

/**
 * Generic user-friendly error messages
 */
const GENERIC_ERRORS = {
  default: "An unexpected error occurred. Please try again later.",
  auth: "Authentication failed. Please log in again.",
  network: "Network error. Please check your connection and try again.",
  validation: "Please check your input and try again.",
  permission: "You do not have permission to perform this action.",
  notFound: "The requested resource was not found.",
  rateLimit: "Too many requests. Please wait a moment and try again.",
  server: "Server error. Our team has been notified.",
  database: "Database error. Please try again later.",
  payment: "Payment processing error. Please try again or contact support.",
  upload: "File upload failed. Please try again.",
} as const;

/**
 * Error types that should be sanitized
 */
const SENSITIVE_ERROR_PATTERNS = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /credential/i,
  /postgres/i,
  /sql/i,
  /database/i,
  /supabase/i,
  /connection/i,
  /ECONNREFUSED/i,
  /stack trace/i,
  /\.env/i,
  /process\.env/i,
  /file:\/\//i,
  /C:\\/i,
  /\/home\//i,
  /localhost:\d+/i,
];

/**
 * Sanitize error message for user display
 * Removes system details, file paths, stack traces, etc.
 */
export function sanitizeErrorForUser(error: unknown): string {
  // If it's a string, check for sensitive content
  if (typeof error === "string") {
    return sanitizeErrorString(error);
  }

  // If it's an Error object
  if (error instanceof Error) {
    return sanitizeErrorString(error.message);
  }

  // If it's an object with a message
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: string }).message;
    return sanitizeErrorString(message);
  }

  // Default generic error
  return GENERIC_ERRORS.default;
}

/**
 * Sanitize error string
 */
function sanitizeErrorString(message: string): string {
  // Check if message contains sensitive information
  for (const pattern of SENSITIVE_ERROR_PATTERNS) {
    if (pattern.test(message)) {
      return GENERIC_ERRORS.server;
    }
  }

  // Check for specific error types and return appropriate message
  if (
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("forbidden")
  ) {
    return GENERIC_ERRORS.permission;
  }

  if (
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("404")
  ) {
    return GENERIC_ERRORS.notFound;
  }

  if (
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("too many")
  ) {
    return GENERIC_ERRORS.rateLimit;
  }

  if (
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("fetch")
  ) {
    return GENERIC_ERRORS.network;
  }

  if (
    message.toLowerCase().includes("payment") ||
    message.toLowerCase().includes("transaction")
  ) {
    return GENERIC_ERRORS.payment;
  }

  if (
    message.toLowerCase().includes("upload") ||
    message.toLowerCase().includes("file")
  ) {
    return GENERIC_ERRORS.upload;
  }

  if (
    message.toLowerCase().includes("validation") ||
    message.toLowerCase().includes("invalid")
  ) {
    return GENERIC_ERRORS.validation;
  }

  // If message is short and doesn't contain sensitive info, return it
  if (message.length < 100 && !containsFilePath(message)) {
    return message;
  }

  // Default generic error
  return GENERIC_ERRORS.default;
}

/**
 * Check if string contains file path
 */
function containsFilePath(str: string): boolean {
  return (
    str.includes("/") ||
    str.includes("\\") ||
    str.includes(".tsx") ||
    str.includes(".ts") ||
    str.includes(".js") ||
    str.includes(".jsx")
  );
}

/**
 * Log full error details server-side
 * Should only be called on the server
 */
export function logErrorDetails(
  error: unknown,
  context?: Record<string, unknown>
): void {
  // Only log on server-side
  if (typeof window !== "undefined") {
    console.warn("logErrorDetails should only be called server-side");
    return;
  }

  const timestamp = new Date().toISOString();
  const errorDetails = {
    timestamp,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    context,
  };

  // Log to console (in production, this would go to a logging service)
  console.error("[ERROR]", JSON.stringify(errorDetails, null, 2));

  // TODO: In production, send to error tracking service
  // e.g., Sentry, LogRocket, Datadog, etc.
}

/**
 * Create API error response with sanitized message
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  context?: Record<string, unknown>
): Response {
  // Log full error details server-side
  logErrorDetails(error, context);

  // Return sanitized error to user
  return new Response(
    JSON.stringify({
      error: sanitizeErrorForUser(error),
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, unknown>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logErrorDetails(error, { ...context, args });
      throw new Error(sanitizeErrorForUser(error));
    }
  }) as T;
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = unknown>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logErrorDetails(error, { json });
    return fallback;
  }
}

/**
 * Validate and sanitize error for client-side display
 */
export function getDisplayError(error: unknown): {
  message: string;
  canRetry: boolean;
} {
  const message = sanitizeErrorForUser(error);

  // Determine if user can retry
  const canRetry =
    message.includes("network") ||
    message.includes("try again") ||
    message.includes("rate limit");

  return { message, canRetry };
}
