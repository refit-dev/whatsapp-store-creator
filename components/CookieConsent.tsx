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
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-5xl mx-auto border border-gray-200">
          {!showSettings ? (
            // Compact Banner View
            <div className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">🍪</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                        Cookie Preferences
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        We use cookies to enhance your experience. By
                        continuing, you accept our{" "}
                        <a
                          href="/privacy"
                          className="text-blue-600 hover:underline"
                          target="_blank"
                        >
                          Privacy Policy
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleCustomize}
                    className="flex-1 sm:flex-none border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Customize
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Detailed Settings View
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🍪</span>
                    <h2 className="text-lg sm:text-xl font-bold">
                      Cookie Preferences
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
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
                    className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                  >
                    Save Preferences
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
