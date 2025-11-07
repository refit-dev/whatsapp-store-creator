"use client";

import { useState } from "react";
import { Currency, CURRENCIES } from "@/lib/currency-utils";
import { useCurrency } from "./CurrencyProvider";

interface CurrencySwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function CurrencySwitcher({
  className = "",
  showLabel = true,
}: CurrencySwitcherProps) {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const currentConfig = CURRENCIES[currency];
  const otherCurrency: Currency = currency === "INR" ? "USD" : "INR";
  const otherConfig = CURRENCIES[otherCurrency];

  return (
    <div className={`relative ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Currency
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{currentConfig.symbol}</span>
            <span className="font-medium">{currentConfig.code}</span>
            <span className="text-sm text-gray-500">
              ({currentConfig.name})
            </span>
          </div>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute top-full left-0 z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setCurrency(otherCurrency);
                  setIsOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg">{otherConfig.symbol}</span>
                <span className="font-medium">{otherConfig.code}</span>
                <span className="text-sm text-gray-500">
                  ({otherConfig.name})
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      {currency === "USD" && (
        <p className="text-xs text-gray-500 mt-1">
          Payments processed in INR via Razorpay
        </p>
      )}
    </div>
  );
}
