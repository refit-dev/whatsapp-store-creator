# Monthly Target Feature - Database Setup

## Overview

Added functionality for sellers to set monthly revenue targets and track their achievement progress.

## Database Migration Required

### Option 1: Run SQL in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
-- Add monthly_target_cents column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS monthly_target_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN stores.monthly_target_cents IS 'Monthly revenue target in cents';
```

### Option 2: Use Supabase CLI (if configured)

```bash
npx supabase db push
```

### Option 3: Manual Column Addition

If you prefer using the Supabase UI:

1. Go to **Table Editor** → **stores** table
2. Add new column:
   - Name: `monthly_target_cents`
   - Type: `int4` (integer)
   - Default: `0`
   - Allow nullable: No

## Features Implemented

### 1. **MonthlyTarget Component** (`components/MonthlyTarget.tsx`)

- Visual target setting interface
- Real-time progress tracking
- Achievement percentage calculation
- Color-coded progress bar:
  - White: < 75%
  - Yellow: 75-99%
  - Green: 100%+ (achieved)
- Celebration message when target achieved

### 2. **API Endpoint** (`/api/store/update-target`)

- POST endpoint to save monthly target
- Validates store ownership
- Updates `monthly_target_cents` in database

### 3. **OrderAnalytics Update**

- Calculates current month revenue
- Displays monthly target card
- Shows achievement progress
- Responsive design

## How It Works

### Target Setting

1. Seller clicks "Edit" on Monthly Target card
2. Enters target amount in currency units (e.g., 50000 for ₹50,000)
3. Saves target (stored as cents in database)

### Achievement Tracking

- **Current Revenue**: Sum of all orders in current calendar month
- **Target**: User-defined monthly goal
- **Achievement %**: `(Current Revenue / Target) × 100`
- **Remaining**: `Target - Current Revenue`

### Visual Indicators

- Progress bar fills based on achievement percentage
- Status messages:
  - Not achieved: "X more to reach target"
  - Achieved: "🎊 Target Achieved! Congratulations!"

## UI/UX Features

### Monthly Target Card

- **Header**: 🎯 icon with "Edit" button
- **Display Mode**: Shows target, achieved amount, progress bar, status
- **Edit Mode**: Input field with Save/Cancel buttons
- **Colors**: Gradient purple/indigo background
- **Mobile Friendly**: Responsive text and spacing

### Integration

Located in Analytics & Reports section, below time range selector, above metrics grid.

## Data Flow

```
User Input (₹50,000)
    ↓
× 100 (convert to cents)
    ↓
Store in DB (5000000 cents)
    ↓
Calculate achievement %
    ↓
Display progress
```

## Example Calculations

### Scenario 1: Mid-Progress

- Target: ₹50,000
- Current Revenue: ₹30,000
- Achievement: 60%
- Remaining: ₹20,000

### Scenario 2: Target Achieved

- Target: ₹50,000
- Current Revenue: ₹55,000
- Achievement: 110% 🎉
- Remaining: Target exceeded!

## Testing Steps

1. **Set Target**:

   - Go to `/dashboard/orders`
   - Find Monthly Target card
   - Click "Edit"
   - Enter amount (e.g., 50000)
   - Click "Save"

2. **Verify Storage**:

   - Check Supabase `stores` table
   - `monthly_target_cents` should show 5000000

3. **Check Progress**:

   - Create some test orders
   - Refresh orders page
   - Progress bar should update
   - Achievement % should calculate correctly

4. **Test Achievement**:
   - Set low target (e.g., 100)
   - Create orders exceeding target
   - Should see green bar and celebration message

## Mobile Responsiveness

### Small Screens (< 768px)

- Single column layout
- Compact text sizes
- Touch-friendly buttons
- Stacked target/achieved display

### Large Screens (≥ 768px)

- Full text labels
- Larger fonts
- Spacious layout
- Side-by-side display

## Error Handling

### API Errors

- Network failure: Alert shown to user
- Unauthorized: Redirects to auth
- Invalid data: 400 error returned

### UI States

- Loading: "Saving..." button text
- Disabled buttons during save
- Input validation (minimum 0)

## Future Enhancements

Possible additions:

- Historical target tracking
- Target vs actual charts
- Weekly targets
- Target categories (by product/location)
- Email notifications when close to target
- Target achievement history

## Files Modified/Created

### New Files

- ✨ `components/MonthlyTarget.tsx`
- ✨ `app/api/store/update-target/route.ts`
- ✨ `supabase/migrations/20251111000001_add_monthly_target.sql`

### Modified Files

- 🔧 `components/OrderAnalytics.tsx` - Added MonthlyTarget integration
- 🔧 `app/dashboard/orders/page.tsx` - Pass store data to analytics

## Support

If the target doesn't save:

1. Check browser console for errors
2. Verify database migration ran successfully
3. Confirm user is authenticated
4. Check store ownership permissions

---

**Status**: ✅ Implemented and Build Successful
**Database Migration**: ⚠️ Required (see instructions above)
