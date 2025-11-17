"use client";

import { useState, useEffect } from "react";
import {
  hasConsent,
  saveCookieConsent,
  acceptAllCookies,
  rejectNonEssential,
  getCookieConsent,
  type CookieConsent as CookieConsentType,
} from "@/lib/cookie-consent";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const consent = getCookieConsent();
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    acceptAllCookies();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectNonEssential();
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    saveCookieConsent({
      essential: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleCustomize = () => {
    setShowSettings(true);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍪</span>
              <h2 className="text-2xl font-bold">Cookie Preferences</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showSettings ? (
              // Simple Banner View
              <>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  We use cookies to enhance your browsing experience, serve
                  personalized content, and analyze our traffic. Cookies help us
                  understand how you use our site and improve your experience.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>🔒 Your Privacy Matters:</strong> You can customize
                    your cookie preferences at any time. Essential cookies are
                    required for the site to function and cannot be disabled.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Accept All Cookies
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Reject Non-Essential
                  </button>
                  <button
                    onClick={handleCustomize}
                    className="flex-1 border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                  >
                    Customize
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  By clicking "Accept All Cookies", you agree to our{" "}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a
                    href="/terms"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    Terms of Service
                  </a>
                </p>
              </>
            ) : (
              // Detailed Settings View
              <>
                <p className="text-gray-700 mb-6">
                  Choose which cookies you want to allow. You can change these
                  settings at any time.
                </p>

                {/* Cookie Categories */}
                <div className="space-y-4">
                  {/* Essential Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">⚙️</span>
                          <h3 className="font-semibold text-gray-900">
                            Essential Cookies
                          </h3>
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Always Active
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          These cookies are necessary for the website to
                          function and cannot be disabled. They are usually only
                          set in response to actions made by you such as setting
                          your privacy preferences, logging in, or filling in
                          forms.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📊</span>
                          <h3 className="font-semibold text-gray-900">
                            Analytics Cookies
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          These cookies help us understand how visitors interact
                          with our website by collecting and reporting
                          information anonymously. This helps us improve our
                          website's functionality and user experience.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.analytics}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                analytics: e.target.checked,
                              })
                            }
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Allow analytics cookies
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🎯</span>
                          <h3 className="font-semibold text-gray-900">
                            Marketing Cookies
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          These cookies are used to track visitors across
                          websites. The intention is to display ads that are
                          relevant and engaging, thereby more valuable for
                          publishers and third-party advertisers.
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.marketing}
                            onChange={(e) =>
                              setPreferences({
                                ...preferences,
                                marketing: e.target.checked,
                              })
                            }
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Allow marketing cookies
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                  >
                    Back
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Learn more in our{" "}
                  <a
                    href="/privacy"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
