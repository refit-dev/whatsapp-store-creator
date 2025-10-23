'use client';

import { useState, useEffect } from 'react';

export function ShareStoreLink({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const [storeUrl, setStoreUrl] = useState(`/${handle}`);
  const [displayUrl, setDisplayUrl] = useState(handle);
  
  // Set the full URL after component mounts to avoid hydration mismatch
  useEffect(() => {
    const fullUrl = `${window.location.origin}/${handle}`;
    setStoreUrl(fullUrl);
    setDisplayUrl(`${window.location.host}/${handle}`);
  }, [handle]);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Check out my store: ${storeUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
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
          {copied ? '✓ Copied!' : '📋 Copy Link'}
        </button>
        
        <button
          onClick={shareViaWhatsApp}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap"
        >
          📱 Share on WhatsApp
        </button>
      </div>
    </div>
  );
}