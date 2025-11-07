# Automatic Trial System Implementation

## Overview

This document describes the automatic 30-day trial system implemented for the WhatsApp Store Creator platform. The system ensures that all new users automatically receive a 30-day free trial upon signup, with access restrictions enforced after trial expiration.

## Architecture

### 1. Auto-Trial Components

#### AutoTrialInitializer (`components/AutoTrialInitializer.tsx`)

- **Purpose**: Silently initializes free trials for new users
- **Placement**: Added to dashboard pages via SubscriptionProvider
- **Behavior**:
  - Checks subscription status on component mount
  - Automatically calls `/api/subscription/auto-trial` for users with no subscription
  - Shows brief loading indicator during trial setup
  - Does not block user flow if trial creation fails

#### AccessGuard (`components/AccessGuard.tsx`)

- **Purpose**: Protects dashboard content based on subscription status
- **Features**:
  - Allows trial access by default (`allowTrialAccess=true`)
  - Shows warning banner for trials expiring within 7 days
  - Redirects expired users to billing page
  - Graceful loading states during subscription checks

### 2. API Endpoints

#### Auto-Trial API (`/api/subscription/auto-trial`)

- **Method**: POST
- **Purpose**: Automatically start trials without user interaction
- **Safety Features**:
  - Returns success if user already has active subscription
  - Doesn't fail user flow on errors (returns detailed error info)
  - Includes `shouldStartTrial` flag in response
  - Uses existing `give_free_trial` RPC function

#### Enhanced Auth Callback (`/auth/callback/route.ts`)

- **Enhancement**: Automatically triggers trial creation after successful OAuth login
- **Process**:
  1. Exchange OAuth code for session
  2. Check if user has existing active subscription
  3. Call `give_free_trial` RPC if no subscription exists
  4. Continue to dashboard (don't block on trial errors)

### 3. User Flow

#### New User Signup

```
User Signs Up → Email Verification → OAuth Callback → Auto-Trial Creation → Dashboard Access
```

#### Dashboard Access Protection

```
User Accesses Dashboard → SubscriptionProvider → AutoTrialInitializer → AccessGuard → Content/Redirect
```

#### Trial Expiration Handling

```
Expired User → AccessGuard → Upgrade Modal → Billing Page
```

## Implementation Details

### Protected Pages

The following dashboard pages are protected with AccessGuard:

- `/dashboard` (main dashboard)
- `/dashboard/products`
- `/dashboard/orders`
- `/dashboard/store`

### Unprotected Pages

These pages remain accessible to expired users:

- `/dashboard/billing` (allows upgrades)
- `/dashboard/contact-us` (support access)
- All public pages and auth pages

### Trial Warnings

- **7+ days remaining**: No warnings
- **1-7 days remaining**: Orange warning banner with upgrade button
- **0 days (expired)**: Full-page upgrade modal, redirect to billing

## Database Requirements

### Required Tables

- `user_subscriptions`: Stores subscription records with `is_trial` flag
- `subscription_plans`: Defines available plans
- `referral_codes`: For referral system integration

### Required Functions

- `give_free_trial(user_uuid)`: RPC function that creates 30-day trial subscription

### Sample Subscription Record

```sql
{
  user_id: "uuid",
  plan_id: "trial_plan_id",
  starts_at: "2024-01-01T00:00:00Z",
  ends_at: "2024-01-31T00:00:00Z",
  status: "active",
  is_trial: true,
  payment_provider: null,
  payment_id: null
}
```

## Configuration

### Trial Duration

- Default: 30 days from signup
- Configured in `give_free_trial` database function

### Access Control Settings

```typescript
// AccessGuard props
interface AccessGuardProps {
  children: React.ReactNode;
  redirectPath?: string; // Default: "/dashboard/billing"
  allowTrialAccess?: boolean; // Default: true
}
```

## Testing Checklist

### New User Flow

- [ ] User signs up with email/password → auto-trial starts
- [ ] User signs up with Google OAuth → auto-trial starts
- [ ] User with existing trial → no duplicate trial created
- [ ] User with active subscription → no trial attempted
- [ ] Trial creation failure → user still accesses dashboard

### Access Protection

- [ ] Active subscription → full access to all dashboard pages
- [ ] Active trial → full access to all dashboard pages
- [ ] Trial with 1-7 days → warning banner shown
- [ ] Expired trial → redirected to billing page
- [ ] No subscription → auto-trial triggers, then access granted

### Edge Cases

- [ ] Database connection failure during trial creation
- [ ] Multiple concurrent trial creation attempts
- [ ] User manually calling start-trial API
- [ ] Subscription status changes while user is active

## Error Handling

### Auto-Trial Failures

- API returns error details but doesn't block user flow
- Console logging for debugging
- User can manually start trial via SubscriptionStatus component

### Access Guard Failures

- Default to allowing access if subscription check fails
- Graceful fallback to billing page redirect
- Loading states during subscription verification

## Integration Points

### Existing Systems

- **SubscriptionProvider**: Provides subscription context to all components
- **SubscriptionStatus**: Manual trial creation fallback
- **Referral System**: Extends trials for referral rewards
- **Billing System**: Handles upgrades from trial to paid plans

### External Dependencies

- Supabase Auth for user management
- Supabase RLS for subscription data security
- Razorpay for payment processing (separate from trial system)

## Monitoring & Analytics

### Key Metrics to Track

- Trial conversion rate (trial → paid subscription)
- Average days to conversion
- Trial abandonment points
- Auto-trial success rate

### Logging Points

- Auto-trial creation success/failure
- Access guard redirects
- Manual trial creations
- Subscription status changes

## Maintenance Notes

### Regular Tasks

- Monitor auto-trial success rates
- Review trial expiration notifications
- Update trial duration if needed
- Clean up expired trial records

### Code Locations

- **Auto-trial logic**: `components/AutoTrialInitializer.tsx`
- **Access protection**: `components/AccessGuard.tsx`
- **Auth callback**: `app/auth/callback/route.ts`
- **Trial API**: `app/api/subscription/auto-trial/route.ts`
- **Dashboard integration**: All `/dashboard/**/page.tsx` files
