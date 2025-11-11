"use client";

import { useState, useEffect } from "react";

interface ShareStoreLinkProps {
  handle: string;
  storeId: string;
}

export function ShareStoreLink({ handle, storeId }: ShareStoreLinkProps) {
  const [copied, setCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState(`/${handle}`);
  const [displayUrl, setDisplayUrl] = useState(handle);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Check verification status
  useEffect(() => {
    async function checkVerification() {
      try {
        const res = await fetch(`/api/whatsapp/status?storeId=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          setIsVerified(data.verified);
        }
      } catch (error) {
        console.error("Failed to check verification:", error);
      } finally {
        setLoading(false);
      }
    }

    checkVerification();
  }, [storeId]);

  // Set the full URL after component mounts to avoid hydration mismatch
  useEffect(() => {
    const fullUrl = `${window.location.origin}/${handle}`;
    setStoreUrl(fullUrl);
    setDisplayUrl(`${window.location.host}/${handle}`);
  }, [handle]);

  const copyToClipboard = async () => {
    if (!isVerified) return;

    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaWhatsApp = () => {
    if (!isVerified) return;

    const message = encodeURIComponent(`Check out my store: ${storeUrl}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        <span className="text-sm">Checking verification status...</span>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">
              Phone Verification Required
            </h4>
            <p className="text-sm text-yellow-700">
              Please verify your phone number in the settings below before
              sharing your store link. This helps prevent spam and ensures
              customers can reach you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-green-600">✓</span>
          <p className="text-sm text-green-700 font-medium">
            Phone verified - Your store is ready to share!
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
          <span className="text-sm text-gray-600 truncate max-w-[200px]">
            {displayUrl}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
          >
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>

          <button
            onClick={shareViaWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
          >
            📱 Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
