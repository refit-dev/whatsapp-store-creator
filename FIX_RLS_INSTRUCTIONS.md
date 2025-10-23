# 🔧 Fix for Row Level Security Error

## The Problem
You're getting the error: **"new row violates row-level security policy for table 'stores'"**

This happens because when you sign up through Supabase Auth, your user isn't automatically added to the `users` table, but the Row Level Security policies require it.

## Quick Fix

### Step 1: Run the Fix SQL Script

1. **Open your Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy the entire contents of `FIX_RLS_ERROR.sql`**
4. **Paste and click RUN**

This script will:
- ✅ Create a trigger to automatically add users when they sign up
- ✅ Add your existing auth user to the users table
- ✅ Update RLS policies to allow store creation
- ✅ Fix permissions for products and orders

### Step 2: Try Creating Your Store Again

After running the script:
1. Go back to the store settings page
2. Fill in your details:
   - Store Name: Lightsapien (or your preferred name)
   - Store Handle: lightsapien
   - WhatsApp Number: +91730484472
   - Currency: INR
3. Click "Create Store"

It should work now! 🎉

## What This Fixes

The script ensures:
1. **Automatic User Creation** - When someone signs up, they're automatically added to the users table
2. **Proper RLS Policies** - Users can create, view, and update their own stores
3. **Product Management** - Store owners can manage their products
4. **Order Viewing** - Store owners can view their orders

## Alternative Quick Fix (If Still Having Issues)

If you're still having problems after running the script, you can temporarily disable RLS to create your store:

```sql
-- Temporarily disable RLS (NOT for production!)
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

Then re-enable it after creating your store:

```sql
-- Re-enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## Verification

To verify the fix worked:
1. Your store should be created successfully
2. You should see your store on the dashboard
3. You should be able to add products
4. Your store link should work: `/lightsapien`

Let me know if you need any help!