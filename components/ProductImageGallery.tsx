"use client";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">📦</div>
          <p className="text-gray-500 text-sm">No image available</p>
        </div>
      </div>
    );
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleSwipe = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const swipeThreshold = 50;

    if (touch) {
      const startX = touch.clientX;
      const endX = startX;

      if (startX - endX > swipeThreshold) {
        goToNext();
      } else if (endX - startX > swipeThreshold) {
        goToPrevious();
      }
    }
  };

  return (
    <div className="relative w-full">
      {/* Main Image Container */}
      <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onTouchEnd={handleSwipe}
        />

        {/* Navigation Arrows (Desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all backdrop-blur-sm hidden md:block"
              aria-label="Previous image"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all backdrop-blur-sm hidden md:block"
              aria-label="Next image"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Swipe Hint (Mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm md:hidden">
            ← Swipe →
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-blue-600 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Dot Indicators (Alternative for few images) */}
      {images.length > 1 && images.length <= 5 && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-blue-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
