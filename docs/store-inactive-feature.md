# Store Inactive Feature - Implementation Guide

## Overview

Sellers can now temporarily deactivate their entire store. When a store is inactive, customers will see a "Store Temporarily Closed" message instead of the product catalog.

## Use Cases

- Taking a vacation or break
- Temporarily out of stock on all items
- Store maintenance or inventory updates
- Need to pause orders temporarily
- Holiday closures

## Database Migration Required

### Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add is_active column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMENT ON COLUMN stores.is_active IS 'Whether the store is active and visible to customers. If false, store will show as temporarily closed.';
```

**OR** if using Supabase CLI:

```bash
npx supabase db push
```

The migration file is located at: `supabase/migrations/20251115000001_add_store_is_active.sql`

## Features Implemented

### 1. Store Status Toggle Component

**Location:** `components/StoreStatusToggle.tsx`

**Features:**

- Visual status indicator (GREEN = Active, RED = Inactive)
- One-click toggle to activate/deactivate
- Confirmation modal when deactivating
- Clear description of what happens when inactive
- Helpful tips on when to use this feature
- Success/error messages

**UI Elements:**

- Current status badge (ACTIVE/INACTIVE)
- Status description card with emoji indicators
- Action button (changes text based on current state)
- Info box with use cases
- Confirmation modal with warning

### 2. Store Settings Integration

**Location:** `components/StoreSettingsForm.tsx`

**Changes:**

- Added `StoreStatusToggle` import
- Placed status toggle at the top of settings (high visibility)
- Passes store ID and current is_active status

### 3. Storefront Protection

**Location:** `app/[handle]/page.tsx`

**Changes:**

- Added `is_active` to store query
- Early return if `store.is_active === false`
- Shows customer-friendly "Store Temporarily Closed" page
- Includes store name in message
- Clean, professional design with helpful tip

**Closed Store Page Features:**

- Amber warning icon with clock symbol
- Clear heading: "Store Temporarily Closed"
- Store name displayed
- Message: "Please check back later!"
- Helpful tip for customers to contact owner

### 4. Type Definitions Updated

**Files Modified:**

- `types/supabase.ts` - Added `is_active: boolean | null` to stores Row type
- `types/interfaces.ts` - Store interface inherits is_active from Row type

## User Experience

### For Sellers (Dashboard)

1. Navigate to **Store Settings**
2. See **Store Status** section at the top
3. Current status clearly displayed (ACTIVE/INACTIVE badge)
4. Click **"Deactivate Store"** button
5. Confirmation modal appears with explanation
6. Click **"Yes, Deactivate"** to confirm
7. Success message appears
8. Store is now inactive

**To Reactivate:**

- Click **"Activate Store"** button
- No confirmation needed
- Instant activation

### For Customers (Storefront)

**When store is ACTIVE:**

- Normal storefront with all products visible
- Can browse and place orders

**When store is INACTIVE:**

- See "Store Temporarily Closed" page
- Clean, professional message
- Store name displayed
- Suggestion to check back later
- No products or order functionality visible

## Technical Details

### Database Schema

```sql
stores {
  ...existing columns...
  is_active: BOOLEAN DEFAULT true
}
```

### API/Database Queries

**Store Settings Update:**

```typescript
await supabase
  .from("stores")
  .update({ is_active: newStatus })
  .eq("id", storeId);
```

**Storefront Check:**

```typescript
const { data: store } = await supabase
  .from("stores")
  .select("..., is_active")
  .eq("handle", params.handle)
  .single();

if (store.is_active === false) {
  // Show closed message
}
```

### State Management

**Component State:**

- `isActive` - Current store status (boolean)
- `loading` - Loading state during update
- `message` - Success/error messages
- `showConfirmModal` - Confirmation dialog visibility
- `pendingStatus` - Temporary storage for pending status change

## Default Behavior

- **New Stores:** Created with `is_active = true` (active by default)
- **Existing Stores:** Migration sets `is_active = true` for all existing stores
- **Null Handling:** Treated as true (active) using `?? true` operator

## Safety Features

1. **Confirmation Modal:** Prevents accidental deactivation
2. **Clear Warnings:** Explains what happens when deactivated
3. **Data Preservation:** All products, orders, and settings remain intact
4. **Instant Reactivation:** No confirmation needed to activate
5. **Status Badge:** Always visible current state
6. **Loading States:** Prevents duplicate requests

## Testing Checklist

- [ ] Create new store (should be active by default)
- [ ] Deactivate store from settings
- [ ] Visit storefront URL (should see closed message)
- [ ] Try to access products directly (should be blocked)
- [ ] Reactivate store from settings
- [ ] Visit storefront (should show products)
- [ ] Check that orders and data are preserved
- [ ] Test confirmation modal (cancel and confirm)
- [ ] Check mobile responsiveness
- [ ] Verify success/error messages display correctly

## Migration Instructions

### For Existing Users

1. **Run the SQL Migration:**

   - Go to Supabase Dashboard
   - Navigate to SQL Editor
   - Run the migration SQL from above
   - All existing stores will default to `is_active = true`

2. **Restart Development Server:**

   ```bash
   pnpm dev
   ```

3. **Verify:**
   - Go to Store Settings
   - See the new "Store Status" section
   - Try toggling the status
   - Visit your storefront when inactive

### For New Deployments

The migration file is included in `supabase/migrations/` and will run automatically when setting up the database.

## Notes

- Store data (products, orders, settings) is NEVER deleted when deactivating
- Staff members can still access the dashboard when store is inactive
- Only the public storefront is affected
- Reactivation is instant (no delay)
- Store owners receive clear feedback on status changes

## Future Enhancements (Optional)

- Schedule automatic activation/deactivation
- Send notification when store is reactivated
- Analytics on inactive periods
- Custom message for customers during inactive period
- Email notification to store owner when deactivating
