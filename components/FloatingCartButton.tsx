"use client";

import { useCart } from "./CartProvider";
import { useRouter } from "next/navigation";

export function FloatingCartButton({ handle }: { handle: string }) {
  const { items, subtotalCents } = useCart();
  const router = useRouter();

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  // Always show cart if there are items
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 animate-slide-up">
      <button
        onClick={() => router.push(`/${handle}/checkout`)}
        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 md:px-6 md:py-4 rounded-full shadow-2xl hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 md:gap-3 group hover:scale-105 transform touch-target"
      >
        <div className="relative">
          <svg
            className="w-5 h-5 md:w-6 md:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="absolute -top-2 -right-2 bg-white text-green-600 rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-bold animate-bounce">
            {totalItems}
          </span>
        </div>
        <span className="font-semibold text-sm md:text-base hidden sm:inline">
          View Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
        </span>
        <span className="font-semibold text-sm sm:hidden">
          Cart ({totalItems})
        </span>
        <svg
          className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform"
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
    </div>
  );
}
