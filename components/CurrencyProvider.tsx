"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  Currency,
  detectUserCurrency,
  formatSubscriptionPrice,
} from "@/lib/currency-utils";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
  prices: {
    monthly: string;
    yearly: string;
    monthlyRaw: number;
    yearlyRaw: number;
  };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(
  undefined
);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currency, setCurrency] = useState<Currency>("INR"); // Safe default
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeCurrency() {
      try {
        // Check if user has a saved preference
        const savedCurrency = localStorage.getItem(
          "preferred-currency"
        ) as Currency;
        if (
          savedCurrency &&
          (savedCurrency === "INR" || savedCurrency === "USD")
        ) {
          setCurrency(savedCurrency);
          setIsLoading(false);
          return;
        }

        // Auto-detect based on location
        const detectedCurrency = await detectUserCurrency();
        setCurrency(detectedCurrency);

        // Save the detected preference
        localStorage.setItem("preferred-currency", detectedCurrency);
      } catch (error) {
        console.log("Currency initialization failed, using INR:", error);
        setCurrency("INR"); // Safe fallback
      } finally {
        setIsLoading(false);
      }
    }

    initializeCurrency();
  }, []);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("preferred-currency", newCurrency);
  };

  const prices = formatSubscriptionPrice(currency);

  const value: CurrencyContextType = {
    currency,
    setCurrency: handleSetCurrency,
    isLoading,
    prices,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
