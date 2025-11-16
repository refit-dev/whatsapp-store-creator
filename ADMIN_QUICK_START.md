# 🛡️ Admin Panel - Quick Start Guide

## ✅ Implementation Complete!

The Manual Admin Approval system has been successfully implemented without breaking any existing code. Build passed successfully!

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Apply Database Migration

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Open the file: `supabase/migrations/20251116000001_add_store_approval_system.sql`
4. Copy all the SQL code
5. Paste into Supabase SQL Editor
6. Click "Run" button

**Option B: Using Supabase CLI**

```bash
supabase db push
```

### Step 2: Add Yourself as Admin

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace with YOUR email):

```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL@example.com';
```

3. Copy your `id` (UUID) from the result

4. Run this query (replace YOUR_USER_ID and YOUR_EMAIL):

```sql
INSERT INTO admins (user_id, email, is_active)
VALUES (
  'YOUR_USER_ID_FROM_STEP_2',
  'YOUR_EMAIL@example.com',
  true
);
```

### Step 3: Access Admin Panel

1. Start your dev server (if not running):

```bash
pnpm dev
```

2. Navigate to: **http://localhost:3000/admin**

3. You should see the admin dashboard! 🎉

---

## 📋 What You Can Do Now

### Admin Panel Features:

- ✅ **Dashboard**: View statistics (total, pending, approved, rejected stores)
- ✅ **Review Pending Stores**: Approve or reject stores with reasons
- ✅ **View All Stores**: See all stores with their status
- ✅ **Preview Stores**: Click to view storefront before approving

### Seller Experience:

- ✅ **Pending Banner**: Sellers see their approval status on dashboard
- ✅ **Rejection Feedback**: Clear reasons when store is rejected
- ✅ **Can Edit While Pending**: Sellers can update store while waiting

### Public Protection:

- ✅ **Unapproved Stores Hidden**: Only approved stores are publicly accessible
- ✅ **"Under Review" Page**: Visitors see appropriate message for pending stores
- ✅ **"Not Available" Page**: Rejected stores show unavailable message

---

## 🧪 Testing the System

### Create a Test Store

1. Log out from admin account
2. Sign up with a new test account
3. Create a new store
4. Store will be in "pending" status

### Review as Admin

1. Log in with your admin account
2. Go to `/admin/stores`
3. You should see the test store
4. Try approving it
5. Visit the storefront - it should now be accessible

### Test Rejection

1. Create another test store
2. As admin, reject it with a reason
3. Log in as that seller
4. You should see the rejection banner with your reason

---

## 🎯 Default Behavior

### For Existing Stores:

- Automatically set to "approved" (backward compatibility)
- No impact on currently live stores
- Business continues as usual

### For New Stores:

- Created with status "pending"
- Not publicly accessible until approved
- Seller can edit and prepare while waiting

---

## 🔑 Admin Routes

| Route               | Purpose                   |
| ------------------- | ------------------------- |
| `/admin`            | Dashboard with statistics |
| `/admin/stores`     | Review pending stores     |
| `/admin/all-stores` | View all stores           |

---

## 📊 Database Tables

### Stores (Updated)

- `approval_status`: "pending" (default), "approved", "rejected"
- `rejection_reason`: Text explaining rejection
- `approved_at`: Timestamp of approval/rejection
- `approved_by`: Admin user ID who performed action

### Admins (New)

- `user_id`: Link to auth.users
- `email`: Admin email
- `is_active`: Boolean to enable/disable admin

---

## 🔒 Security

- ✅ Admin routes protected by authentication
- ✅ Only users in `admins` table can access admin panel
- ✅ RLS policies prevent unauthorized database access
- ✅ API routes verify admin status
- ✅ Input validation on all endpoints

---

## 🐛 Troubleshooting

### Can't Access Admin Panel?

**Error**: Redirected to dashboard with "not_authorized" message

**Solution**: Make sure you added yourself to the `admins` table:

```sql
SELECT * FROM admins WHERE email = 'YOUR_EMAIL@example.com';
```

If no results, re-run Step 2 above.

### Migration Failed?

**Error**: Column already exists or table already exists

**Solution**: Migration might be partially applied. Check:

```sql
-- Check if approval_status column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'stores' AND column_name = 'approval_status';

-- Check if admins table exists
SELECT * FROM information_schema.tables WHERE table_name = 'admins';
```

### No Pending Stores?

**Reason**: Existing stores auto-approved for backward compatibility

**Test**: Create a new store with a fresh account - it will be pending

---

## 📝 Next Steps (Optional)

### Enhance Email Notifications

The TODO comment is in: `app/api/admin/approve-store/route.ts`

Add email sending after approval/rejection using your email service (Resend, SendGrid, etc.)

### Add Resubmit Flow

Allow sellers to resubmit rejected stores for re-review

### Admin Activity Log

Track all admin actions (who approved/rejected what and when)

### Bulk Actions

Approve/reject multiple stores at once

---

## 📁 Files Created

### Database:

- `supabase/migrations/20251116000001_add_store_approval_system.sql`

### Admin Panel:

- `app/admin/layout.tsx` - Admin layout with nav
- `app/admin/page.tsx` - Admin dashboard
- `app/admin/stores/page.tsx` - Pending stores list
- `app/admin/stores/StoreReviewClient.tsx` - Review UI
- `app/admin/all-stores/page.tsx` - All stores table

### API:

- `app/api/admin/approve-store/route.ts` - Approval endpoint

### Components:

- `components/StoreApprovalBanner.tsx` - Seller dashboard banner

### Documentation:

- `docs/admin-approval-system.md` - Full documentation
- `scripts/setup-admin.sql` - SQL helper script

---

## ✨ Features Summary

### ✅ Implemented:

- Database migration with approval system
- Admin table and authentication
- Admin dashboard with statistics
- Pending stores review interface
- Approve/Reject functionality with reasons
- Seller approval status banners
- Public storefront protection
- Security and RLS policies
- Full TypeScript types
- Zero breaking changes

### ⏳ Future Enhancements:

- Email notifications (optional)
- Resubmit flow for rejected stores
- Admin activity logs
- Bulk actions
- Advanced filters and search

---

## 🎉 Success!

Your admin approval system is now live and ready to use!

**Test it now:**

1. Go to `/admin`
2. Review any pending stores
3. Try the approval flow

**Questions?** Check the full documentation in `docs/admin-approval-system.md`

---

**Build Status**: ✅ Passed  
**Breaking Changes**: ❌ None  
**Backward Compatible**: ✅ Yes  
**Production Ready**: ✅ Yes
