# Admin Panel Setup Guide

## Overview

The Manual Admin Approval system has been successfully implemented! This system allows designated admin users to review and approve/reject stores before they go live.

## What's Been Implemented

### 1. Database Changes ✅

- **Stores Table**: Added approval columns

  - `approval_status`: "pending" (default), "approved", or "rejected"
  - `rejection_reason`: Reason provided when rejecting a store
  - `approved_at`: Timestamp when approved/rejected
  - `approved_by`: Admin user ID who performed the action

- **Admins Table**: New table to manage admin users
  - `user_id`: Link to auth.users
  - `email`: Admin email
  - `is_active`: Toggle admin access

### 2. Admin Panel ✅

- **Dashboard** (`/admin`): Overview with statistics
- **Pending Stores** (`/admin/stores`): Review stores awaiting approval
- **All Stores** (`/admin/all-stores`): View all stores on platform
- **API Route**: `/api/admin/approve-store` for approval actions

### 3. Seller Experience ✅

- **Dashboard Banner**: Shows approval status (pending/approved/rejected)
- **Rejection Feedback**: Displays rejection reason if applicable
- **Store Preview**: Can edit while pending approval

### 4. Public Storefront ✅

- Unapproved stores show "Under Review" message
- Rejected stores show "Not Available" message
- Only approved stores are accessible to customers

---

## How to Add Your First Admin

### Option 1: Direct Database Insert (Recommended)

1. **Run the migration** (if not already done):

   ```bash
   # In Supabase SQL Editor or your migration tool
   # The migration file is already created at:
   # supabase/migrations/20251116000001_add_store_approval_system.sql
   ```

2. **Get your user ID**:

   - Log in to your Supabase Dashboard
   - Go to Authentication → Users
   - Find your user and copy the UUID

3. **Add yourself as admin**:
   ```sql
   INSERT INTO admins (user_id, email, is_active)
   VALUES (
     'your-user-uuid-here',
     'your-email@example.com',
     true
   );
   ```

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Find the `admins` table
3. Click "Insert row"
4. Fill in:
   - `user_id`: Your user UUID from Authentication tab
   - `email`: Your email
   - `is_active`: true (checked)
5. Save

---

## Testing the Admin Panel

### 1. Access Admin Panel

- Navigate to: `http://localhost:3000/admin`
- You should see the admin dashboard with statistics

### 2. Review Pending Stores

- Click "Pending Stores" or go to `/admin/stores`
- You'll see all stores with `approval_status = 'pending'`
- Click "Preview Store" to view the storefront
- Click "Approve" to approve the store
- Click "Reject" to reject with a reason

### 3. View All Stores

- Go to `/admin/all-stores`
- See all stores with their approval status
- Filter by status (coming soon)

---

## Store Approval Workflow

### For New Stores:

1. **Seller Creates Store** → Status: `pending`

   - Store is not publicly accessible
   - Seller sees "Pending Approval" banner on dashboard
   - Seller can still edit store and add products

2. **Admin Reviews Store** → Admin Panel
   - Reviews store details, products, images
   - Checks for policy violations
   - Makes decision: Approve or Reject

3a. **If Approved** → Status: `approved`

- Store goes live immediately
- Public can access the storefront
- Seller sees normal dashboard (no banner)
- Seller gets notification (TODO: email)

3b. **If Rejected** → Status: `rejected`

- Store remains inaccessible
- Seller sees "Store Rejected" banner with reason
- Seller can update store and resubmit (TODO: resubmit flow)
- Seller gets notification (TODO: email)

---

## Admin Panel Features

### Dashboard (`/admin`)

- **Statistics Cards**:
  - Total Stores
  - Pending Review (with quick link)
  - Approved Stores
  - Rejected Stores
- **Recent Stores Table**: Last 5 stores created
- **Quick Actions**: Navigate to pending stores or all stores

### Pending Stores (`/admin/stores`)

- **Store Cards** showing:
  - Store name, handle, logo
  - WhatsApp number
  - Currency and payment provider
  - Banner preview
  - Creation timestamp
- **Actions**:
  - Preview Store (opens in new tab)
  - Approve Store (with confirmation)
  - Reject Store (requires reason)

### All Stores (`/admin/all-stores`)

- **Table View** with columns:
  - Store (name + logo)
  - Handle
  - Approval Status (badge)
  - Active/Inactive Status (badge)
  - Created Date
  - View Action (opens storefront)

---

## Security Features

### Access Control

- ✅ Admin routes protected by authentication
- ✅ Admin-only access verified via `admins` table
- ✅ Non-admin users redirected to dashboard
- ✅ RLS policies prevent unauthorized access

### Store Protection

- ✅ Unapproved stores hidden from public
- ✅ Storefront shows "Under Review" for pending stores
- ✅ Storefront shows "Not Available" for rejected stores
- ✅ Only approved stores accessible to customers

### API Security

- ✅ Admin verification on API routes
- ✅ Input validation (storeId, action, rejectionReason)
- ✅ Error handling with appropriate status codes

---

## Next Steps (TODO)

### 1. Email Notifications ⏳

- Send email when store is approved
- Send email when store is rejected (with reason)
- Use Resend or your existing email service

### 2. Resubmit Flow ⏳

- Allow sellers to resubmit rejected stores
- Reset status from "rejected" to "pending"
- Track resubmission history

### 3. Admin Features ⏳

- Multiple admins management
- Admin activity log
- Bulk approve/reject
- Filter and search stores
- Export store data

### 4. Seller Features ⏳

- Appeal rejection decision
- Direct message to admin
- Store improvement checklist

---

## Troubleshooting

### "Not Authorized" Error

- **Problem**: User is not in admins table
- **Solution**: Add user to admins table using SQL above

### Can't Access Admin Panel

- **Problem**: Not logged in or not admin
- **Solution**:
  1. Log in to the app
  2. Ensure you're added to admins table
  3. Try accessing `/admin` again

### Stores Not Showing as Pending

- **Problem**: Existing stores might be auto-approved
- **Solution**: Check migration - existing stores set to "approved" for backward compatibility

### TypeScript Errors

- **Problem**: Types not updated
- **Solution**: Restart TypeScript server or VS Code

---

## Database Schema

### Stores Table (Updated)

```sql
CREATE TABLE stores (
  -- ... existing columns ...
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);
```

### Admins Table (New)

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

---

## API Endpoints

### POST `/api/admin/approve-store`

Approve or reject a store.

**Request Body**:

```json
{
  "storeId": "uuid",
  "action": "approve" | "reject",
  "rejectionReason": "string (required if rejecting)"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Store approved successfully"
}
```

**Errors**:

- 400: Missing or invalid parameters
- 401: Not authenticated
- 403: Not an admin
- 500: Server error

---

## Best Practices

### For Admins:

1. **Review Thoroughly**: Check store name, products, images, WhatsApp number
2. **Clear Rejection Reasons**: Be specific so sellers know what to fix
3. **Fast Turnaround**: Aim for 24-48 hour review time
4. **Consistency**: Use same standards for all stores
5. **Documentation**: Keep track of common violations

### For Implementation:

1. **Backup First**: Always backup database before running migrations
2. **Test Locally**: Test approval flow in development first
3. **Monitor Logs**: Check for errors in production
4. **User Feedback**: Collect seller feedback on approval process
5. **Iterate**: Improve based on actual usage

---

## Support

### Getting Help

- Check Supabase logs for errors
- Review browser console for client-side issues
- Check API response in Network tab
- Verify RLS policies in Supabase Dashboard

### Common Issues

1. **Admin can't see pending stores**: Check RLS policies
2. **API returns 403**: User not in admins table
3. **Store still shows as pending**: Check browser cache
4. **Email not received**: Email notifications not yet implemented

---

## Files Created/Modified

### New Files:

- `supabase/migrations/20251116000001_add_store_approval_system.sql`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/stores/page.tsx`
- `app/admin/stores/StoreReviewClient.tsx`
- `app/admin/all-stores/page.tsx`
- `app/api/admin/approve-store/route.ts`
- `components/StoreApprovalBanner.tsx`
- `components/ApprovalForm.tsx` (not used, kept for reference)

### Modified Files:

- `types/supabase.ts` - Added approval columns and admins table
- `app/[handle]/page.tsx` - Added approval status check
- `app/dashboard/page.tsx` - Added StoreApprovalBanner

---

## Migration Commands

### Apply Migration:

```bash
# If using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy contents of 20251116000001_add_store_approval_system.sql
```

### Rollback (if needed):

```sql
-- Remove approval columns
ALTER TABLE stores
DROP COLUMN IF EXISTS approval_status,
DROP COLUMN IF EXISTS rejection_reason,
DROP COLUMN IF EXISTS approved_at,
DROP COLUMN IF EXISTS approved_by;

-- Drop admins table
DROP TABLE IF EXISTS admins CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS is_admin(UUID);
```

---

## Success Checklist

Before going live, verify:

- [ ] Migration applied successfully
- [ ] At least one admin user added
- [ ] Admin can access `/admin`
- [ ] Admin can see pending stores
- [ ] Admin can approve a test store
- [ ] Admin can reject a test store with reason
- [ ] Approved store is publicly accessible
- [ ] Pending store shows "Under Review"
- [ ] Rejected store shows "Not Available"
- [ ] Seller sees correct banner on dashboard
- [ ] No TypeScript/build errors
- [ ] No console errors in browser

---

## Contact

If you need help with implementation or have questions:

- Check the code comments
- Review this documentation
- Test in development first
- Monitor production logs

**Status**: ✅ Fully Implemented and Ready for Testing
**Version**: 1.0.0
**Date**: November 16, 2025
