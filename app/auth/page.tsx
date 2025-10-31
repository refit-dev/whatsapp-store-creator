"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import {
  checkForDuplicates,
  formatMobileNumber,
  validateMobileNumber,
} from "@/lib/duplicate-validation";
import Link from "next/link";

export default function AuthPage() {
  const sb = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [message, setMessage] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [showDuplicateOptions, setShowDuplicateOptions] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [proceedAnyway, setProceedAnyway] = useState(false);

  async function checkDuplicatesAndWarn() {
    if (!email || (!mobileNumber && isSignUp)) return;

    setCheckingDuplicates(true);
    setDuplicateWarning("");
    setShowDuplicateOptions(false);

    try {
      const duplicates = await checkForDuplicates(email, mobileNumber);

      if (duplicates.emailExists || duplicates.mobileExists) {
        let warningMessage = "We found existing accounts:\n";

        if (duplicates.emailExists) {
          warningMessage += `• An account with email "${email}" already exists\n`;
        }

        if (duplicates.mobileExists) {
          warningMessage += `• A store with mobile number "${mobileNumber}" already exists\n`;
        }

        warningMessage += "\nWould you like to sign in instead?";
        setDuplicateWarning(warningMessage);
        setShowDuplicateOptions(true);
      }
    } catch (error) {
      console.error("Error checking duplicates:", error);
    }

    setCheckingDuplicates(false);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Check if user agreed to terms
    if (!agreeToTerms) {
      setMessage("Please agree to the Terms and Conditions to continue.");
      setLoading(false);
      return;
    }

    // Validate mobile number if provided
    if (mobileNumber && !validateMobileNumber(mobileNumber)) {
      setMessage(
        "Please enter a valid mobile number (10 digits for Indian numbers)."
      );
      setLoading(false);
      return;
    }

    // Check for duplicates first (unless user chose to proceed anyway)
    if (!proceedAnyway && mobileNumber) {
      const duplicates = await checkForDuplicates(email, mobileNumber);

      if (duplicates.mobileExists) {
        let warningMessage =
          "⚠️ A store with this mobile number already exists.\n\n";
        warningMessage +=
          "This might be your existing account. Would you like to sign in instead?\n\n";
        warningMessage +=
          "If you're sure you want to create a new account, click 'Create Account' again.";

        setMessage(warningMessage);
        setProceedAnyway(true);
        setLoading(false);
        return;
      }
    }

    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: {
          mobile_number: mobileNumber
            ? formatMobileNumber(mobileNumber)
            : undefined,
        },
      },
    });

    setLoading(false);

    if (error) {
      if (
        error.message.includes("already") ||
        error.message.includes("exists")
      ) {
        setMessage(
          "An account with this email already exists. Please sign in instead or use a different email."
        );
        setIsSignUp(false); // Switch to sign in mode
      } else {
        setMessage(error.message);
      }
    } else if (data.user) {
      // Check if email confirmation is required
      if (data.user.identities?.length === 0) {
        setMessage("User already exists. Please sign in instead.");
        setIsSignUp(false);
      } else {
        setMessage("Account created! Redirecting to dashboard...");

        // Use window.location to do a full page reload so server can pick up session
        // Store will be auto-created in the dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      }
    }

    // Reset proceed anyway flag
    setProceedAnyway(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await sb.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      setMessage("Success! Redirecting to dashboard...");
      // Use window.location to do a full page reload so server can pick up session
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-gray-600">
              {isSignUp
                ? "Sign up to create your WhatsApp store"
                : "Sign in to manage your store"}
            </p>
          </div>

          <form
            onSubmit={isSignUp ? handleSignUp : handleSignIn}
            className="space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDuplicateWarning("");
                  setShowDuplicateOptions(false);
                  setProceedAnyway(false);
                }}
                onBlur={() => {
                  if (isSignUp && email) {
                    checkDuplicatesAndWarn();
                  }
                }}
                required
                disabled={loading || checkingDuplicates}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Mobile Number Field - Only show during sign up */}
            {isSignUp && (
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mobile Number (WhatsApp){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="+91 98765 43210 or 9876543210"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    setDuplicateWarning("");
                    setShowDuplicateOptions(false);
                    setProceedAnyway(false);
                  }}
                  onBlur={() => {
                    if (isSignUp && mobileNumber) {
                      checkDuplicatesAndWarn();
                    }
                  }}
                  required
                  disabled={loading || checkingDuplicates}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be your store's WhatsApp number for receiving orders
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder={
                  isSignUp
                    ? "Create a strong password (min 6 characters)"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSignUp && (
                <p className="text-sm text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Terms and Conditions Checkbox - Only show during sign up */}
            {isSignUp && (
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agree-terms" className="text-gray-700">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            )}

            {/* Duplicate Warning - Show friendly options */}
            {duplicateWarning && showDuplicateOptions && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Account may already exist
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p className="whitespace-pre-line">{duplicateWarning}</p>
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setDuplicateWarning("");
                          setShowDuplicateOptions(false);
                        }}
                        className="bg-amber-100 text-amber-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-amber-200 transition-colors"
                      >
                        Sign In Instead
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDuplicateWarning("");
                          setShowDuplicateOptions(false);
                          setProceedAnyway(true);
                        }}
                        className="bg-white text-amber-800 px-3 py-2 rounded-md text-sm font-medium border border-amber-300 hover:bg-amber-50 transition-colors"
                      >
                        Continue Anyway
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state for duplicate checking */}
            {checkingDuplicates && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-sm text-blue-700">
                    Checking for existing accounts...
                  </p>
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("Success") || message.includes("created")
                    ? "bg-green-50 text-green-800"
                    : message.includes("⚠️")
                    ? "bg-amber-50 text-amber-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                checkingDuplicates ||
                (isSignUp && !agreeToTerms) ||
                (isSignUp && !mobileNumber.trim())
              }
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isSignUp ? "Creating Account..." : "Signing In..."}
                </>
              ) : checkingDuplicates ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking...
                </>
              ) : (
                <>
                  {isSignUp
                    ? proceedAnyway
                      ? "Create Account Anyway"
                      : "Create Account"
                    : "Sign In"}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage("");
                setDuplicateWarning("");
                setShowDuplicateOptions(false);
                setPassword("");
                setMobileNumber("");
                setAgreeToTerms(false);
                setProceedAnyway(false);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
