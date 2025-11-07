# Multi-Currency Support (USD/INR)

## Overview

The WhatsApp Store Creator now supports displaying subscription prices in both USD and INR based on user location. While payments are processed in INR through Razorpay, international users see familiar USD pricing for better conversion rates.

## Features

### Currency Detection & Display

- **Automatic Detection**: IP-based geolocation determines user's country
- **India Users**: See prices in INR (₹259/month)
- **International Users**: See prices in USD ($3.99/month)
- **Manual Override**: Currency switcher allows manual selection
- **Local Storage**: Remembers user's currency preference

### Payment Processing

- **All Payments**: Processed in INR via Razorpay (supports international cards)
- **Currency Conversion**: Automatic conversion handled by Razorpay
- **Transparent Process**: Users see their preferred currency, pay seamlessly

## Price Mapping

| Plan        | INR Price | USD Price | USD Conversion |
| ----------- | --------- | --------- | -------------- |
| Free Trial  | ₹0        | $0        | Free           |
| Pro Monthly | ₹259      | $3.99     | ~₹259          |
| Pro Yearly  | ₹2,599    | $39.99    | ~₹2,599        |

_USD prices are approximate and may vary with exchange rates_

## Technical Implementation

### Core Components

#### CurrencyProvider (`components/CurrencyProvider.tsx`)

- **Context Management**: Provides currency state across the app
- **Auto-Detection**: Uses IP geolocation API (ipapi.co)
- **Fallback Logic**: Browser locale → Default to INR
- **Local Storage**: Persists user preference

#### Currency Utils (`lib/currency-utils.ts`)

- **Detection Function**: `detectUserCurrency()` - IP-based country detection
- **Conversion Logic**: `convertPrice()` - INR to USD conversion
- **Formatting**: `formatPrice()` - Display with proper currency symbols
- **Price Config**: Central pricing configuration

#### CurrencySwitcher (`components/CurrencySwitcher.tsx`)

- **Manual Override**: Dropdown to switch between INR/USD
- **Visual Feedback**: Shows currency symbols and names
- **Payment Note**: Informs USD users about INR processing

### Integration Points

#### Dashboard Wrapper

```tsx
<CurrencyProvider>
  <SubscriptionProvider>// Dashboard content</SubscriptionProvider>
</CurrencyProvider>
```

#### Billing Page Updates

- **Dynamic Pricing**: Uses `useCurrency()` hook for price display
- **Currency Switcher**: Added to billing page header
- **Payment Notes**: Clear messaging about INR processing for USD users

## User Experience

### India-Based Users

1. **Auto-Detection**: Detected as India → INR currency
2. **Familiar Pricing**: See ₹259/month (standard pricing)
3. **Local Payment**: Pay in INR through Razorpay
4. **No Changes**: Existing experience unchanged

### International Users

1. **Auto-Detection**: Detected as non-India → USD currency
2. **Familiar Pricing**: See $3.99/month (converted pricing)
3. **Payment Process**: Pay in USD, Razorpay converts to INR
4. **Clear Communication**: Notes explain INR processing

### Manual Override

1. **Currency Switcher**: Available on billing page
2. **Instant Update**: Prices update immediately
3. **Saved Preference**: Choice remembered in localStorage
4. **Flexible Experience**: Switch anytime

## Currency Detection Logic

### Primary Detection (IP-based)

```typescript
// API call to ipapi.co
const response = await fetch("https://ipapi.co/json/");
const data = await response.json();
return data.country_code === "IN" ? "INR" : "USD";
```

### Fallback Detection (Browser)

```typescript
// Browser locale check
const locale = navigator.language;
return locale.startsWith("en-IN") ? "INR" : "USD";
```

### Default Fallback

```typescript
// Safe default for existing users
return "INR";
```

## Payment Flow

### For All Users (INR/USD Display)

1. **Display**: User sees preferred currency pricing
2. **Checkout**: Razorpay handles payment in INR
3. **Conversion**: Automatic currency conversion (if needed)
4. **Confirmation**: Payment processed successfully

### Razorpay Integration

- **International Cards**: Accepted and processed
- **Currency Conversion**: Handled automatically
- **Exchange Rates**: Live rates used by Razorpay
- **No Code Changes**: Existing payment flow unchanged

## Configuration

### Exchange Rate

```typescript
// Current rate in currency-utils.ts
USD: {
  rate: 0.012, // 1 INR = 0.012 USD
}

// Update rate as needed:
// ₹259 × 0.012 = $3.11 → Rounded to $3.99
```

### Adding New Currencies

```typescript
// In currency-utils.ts
export const CURRENCIES = {
  INR: {
    /* existing */
  },
  USD: {
    /* existing */
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rate: 0.011, // 1 INR = 0.011 EUR
  },
};
```

### Detection API

- **Primary**: ipapi.co (free tier: 1000 requests/month)
- **Backup**: Can switch to other providers (ip-api.com, etc.)
- **Local Fallback**: Browser locale detection

## Testing

### Test Scenarios

1. **India IP**: Should show INR pricing
2. **US IP**: Should show USD pricing
3. **VPN Testing**: Different countries should show USD
4. **Manual Switch**: Currency switcher should work
5. **Local Storage**: Preference should persist

### Test Commands

```bash
# Test different locales
navigator.language = "en-IN"  # Should default to INR
navigator.language = "en-US"  # Should default to USD

# Test localStorage
localStorage.setItem("preferred-currency", "USD")
localStorage.setItem("preferred-currency", "INR")
```

## Benefits

### For Business

- **Higher Conversion**: Familiar USD pricing for international users
- **Global Reach**: Appeals to worldwide audience
- **No Payment Changes**: Existing Razorpay integration unchanged
- **Transparent Pricing**: Clear communication about processing

### For Users

- **Familiar Pricing**: See prices in expected currency
- **Easy Comparison**: Compare with other services in same currency
- **Flexible Choice**: Manual override available
- **Smooth Payment**: No surprise currency conversions

## Monitoring

### Key Metrics

- **Currency Distribution**: % of users using USD vs INR
- **Conversion Rates**: Signup rates by currency display
- **Geographic Data**: User locations and currency preferences
- **Payment Success**: International payment completion rates

### Analytics Implementation

```typescript
// Track currency selection
analytics.track("currency_selected", {
  currency: "USD",
  method: "auto-detected", // or 'manual'
  country: "US",
});

// Track payment attempts by currency
analytics.track("payment_attempted", {
  display_currency: "USD",
  payment_currency: "INR",
  amount_display: "$3.99",
  amount_charged: "₹259",
});
```

## Future Enhancements

### Potential Additions

1. **More Currencies**: EUR, GBP, CAD support
2. **Live Rates**: Real-time exchange rate updates
3. **Regional Pricing**: Different prices per region
4. **Payment Methods**: Local payment methods per country

### Implementation Considerations

- **Rate Updates**: Scheduled job to update exchange rates
- **Price Optimization**: A/B test different USD price points
- **Payment Providers**: Add Stripe for pure USD processing
- **Tax Handling**: Regional tax calculations

The multi-currency support provides a better user experience for international users while maintaining the existing Razorpay integration and payment flow.
