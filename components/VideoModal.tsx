/**
 * VideoModal Component
 * Displays a YouTube video in a modal with privacy-enhanced embed and event tracking
 */

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackConversion } from "@/lib/analytics";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId?: string;
}

export function VideoModal({
  isOpen,
  onClose,
  videoId = "QfcfaOjXOKw",
}: VideoModalProps) {
  const [videoStarted, setVideoStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen && !videoStarted) {
      // Track when video modal is opened
      trackConversion("video_modal_open", {
        button_location: "hero",
      });
      setVideoStarted(true);
    }
  }, [isOpen, videoStarted]);

  const handleClose = () => {
    // Reset video started state for next view
    setVideoStarted(false);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            See How Watzy Works
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
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

        {/* Video Container */}
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            ref={iframeRef}
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Watzy Store Overview"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Ready to create your own store?{" "}
            <Link
              href="/auth"
              className="text-[#FF7A00] font-semibold hover:text-[#E66D00] transition-colors"
              onClick={() =>
                trackConversion("signup_initiated", {
                  button_location: "video_modal",
                })
              }
            >
              Start Free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
