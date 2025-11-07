# Price Display Fix

## Problem

The product list was showing ₹1 instead of ₹100 for a product priced at ₹100.

## Root Cause

**Double division error** in `components/ProductsList.tsx`:

1. **Product creation**: ₹100 → stored as 10000 cents (100 × 100) ✅
2. **Product display**: `toLocaleString(product.price_cents / 100, currency)`
   - This became: `toLocaleString(10000 / 100, currency)` = `toLocaleString(100, currency)`
   - Inside `toLocaleString`: divides by 100 again: `100 / 100 = 1` ❌
   - Result: ₹1 instead of ₹100

## Solution

**Fixed** in `components/ProductsList.tsx`:

```tsx
// BEFORE (incorrect - double division)
{
  toLocaleString(product.price_cents / 100, currency);
}

// AFTER (correct - single division inside toLocaleString)
{
  toLocaleString(product.price_cents, currency);
}
```

## How Price Conversion Works

### Storage Format

- All prices stored in **cents** (paisa for INR)
- ₹100 = 10000 cents
- $50.99 = 5099 cents

### Display Logic

The `toLocaleString` function in `lib/currency.ts` handles the conversion:

```typescript
export function toLocaleString(amountCents: number, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amountCents / 100); // Division happens HERE
}
```

### Correct Usage Pattern

```tsx
// ✅ CORRECT - pass cents directly
{
  toLocaleString(product.price_cents, currency);
}

// ❌ WRONG - don't divide manually
{
  toLocaleString(product.price_cents / 100, currency);
}
```

## Other Components Checked

✅ **ProductGrid.tsx** - Already correct
✅ **ProductForm.tsx** - Correct (converts back for editing)  
✅ **ProductFormWithUpload.tsx** - Correct (converts back for editing)
✅ **CartSummary.tsx** - Already correct
✅ **CustomerCheckout.tsx** - Already correct

## Testing

1. Create a product with price ₹100
2. Check product list shows ₹100 (not ₹1)
3. Check storefront shows ₹100
4. Check cart/checkout shows ₹100

The fix ensures consistent price display across all components.
