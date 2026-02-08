"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AffiliateSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    paymentMethod: "upi" as const,
    paymentDetails: "",
    bio: "",
    website: "",
    instagram: "",
    twitter: "",
    linkedin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = supabaseBrowser();

      // 1. Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");

      // Check if email confirmation is required
      const needsEmailConfirmation = !authData.session;

      if (needsEmailConfirmation) {
        // Redirect to confirmation page with email and affiliate flag
        const params = new URLSearchParams({
          email: formData.email,
          from: "affiliate",
          // Store affiliate data in sessionStorage for after confirmation
        });

        // Store form data for after confirmation
        sessionStorage.setItem(
          "affiliate_signup_data",
          JSON.stringify({
            fullName: formData.fullName,
            phone: formData.phone,
            paymentMethod: formData.paymentMethod,
            paymentDetails: formData.paymentDetails,
            bio: formData.bio,
            website: formData.website,
            instagram: formData.instagram,
            twitter: formData.twitter,
            linkedin: formData.linkedin,
          })
        );

        // Redirect to confirmation page
        router.push(`/auth/confirm?${params.toString()}`);
        return;
      }

      // 2. Wait for session to be fully established
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Verify session is active
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "Session not established. Please log in at /auth and try again."
        );
      }

      // 4. Register as affiliate partner
      const response = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contact_email: formData.email,
          payment_email: formData.email,
          company_name: formData.fullName,
          payment_method: formData.paymentMethod,
          payment_details: { details: formData.paymentDetails },
          bio: formData.bio,
          website: formData.website,
          social_links: {
            instagram: formData.instagram,
            twitter: formData.twitter,
            linkedin: formData.linkedin,
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to register as affiliate");
      }

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create affiliate account");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome Aboard! 🎉
          </h2>
          <p className="text-gray-600 mb-4">
            Your affiliate account has been created successfully.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold text-blue-600">Watzy</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Join Watzy Affiliate Program
          </h1>
          <p className="text-lg text-gray-600">
            Earn 20% recurring commission on every referral
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <div className="font-semibold text-gray-900">20% MRR</div>
            <div className="text-sm text-gray-600">
              Monthly recurring revenue
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl mb-2">📊</div>
            <div className="font-semibold text-gray-900">
              Real-time Tracking
            </div>
            <div className="text-sm text-gray-600">
              Live dashboard analytics
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-900">Fast Payouts</div>
            <div className="text-sm text-gray-600">
              Monthly automatic payments
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    required
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="upi">UPI (India)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe_connect">Stripe Connect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Details *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.paymentDetails}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentDetails: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      formData.paymentMethod === "upi"
                        ? "yourname@paytm"
                        : formData.paymentMethod === "paypal"
                        ? "paypal@email.com"
                        : formData.paymentMethod === "bank_transfer"
                        ? "Account Number + IFSC"
                        : "Stripe Account ID"
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is where we'll send your commission payments
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Profile (Optional)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell us about yourself and your audience..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({ ...formData, instagram: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) =>
                        setFormData({ ...formData, twitter: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={formData.linkedin}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p>
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                . You'll earn 20% recurring commission on all referred paid
                subscriptions.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                  Creating account...
                </span>
              ) : (
                "Create Affiliate Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/auth"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                How much can I earn?
              </h4>
              <p className="text-sm text-gray-600">
                You earn 20% of every subscription payment your referrals make,
                every month they stay subscribed. Example: If you refer 10 users
                on ₹99/month plan, you earn ₹198/month recurring.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                When do I get paid?
              </h4>
              <p className="text-sm text-gray-600">
                Payouts are processed on the 5th of every month for the previous
                month's earnings. Minimum payout threshold is ₹500.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                How does tracking work?
              </h4>
              <p className="text-sm text-gray-600">
                You get a unique referral link. When someone clicks it, we set a
                30-day cookie. If they sign up and become a paid customer within
                30 days, you get credited.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-1">
                What marketing materials do I get?
              </h4>
              <p className="text-sm text-gray-600">
                After signup, you'll get access to email templates, social media
                graphics, QR codes, and pre-written content to help you promote
                Watzy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
