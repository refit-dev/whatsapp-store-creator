/**
 * Affiliate Partner Program TypeScript Types
 * Auto-generated from Supabase schema
 */

export interface AffiliatePartner {
  id: string;
  user_id: string;
  referral_code: string;
  commission_rate: number;
  status: "pending" | "active" | "suspended" | "terminated";
  payment_method?: "stripe_connect" | "paypal" | "bank_transfer" | "upi";
  payment_details?: Record<string, any>;
  total_earnings: number;
  pending_payout: number;
  last_payout_date?: string;
  bio?: string;
  website?: string;
  social_links?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    [key: string]: string | undefined;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  referral_source: "link" | "qr_code" | "manual" | "api";
  landing_page?: string;
  referral_timestamp: string;
  signup_timestamp?: string;
  first_payment_date?: string;
  status: "pending" | "active" | "churned" | "refunded";
  attribution_window_days?: number;
  device_info?: {
    browser?: string;
    os?: string;
    device_type?: "mobile" | "tablet" | "desktop";
  };
  utm_params?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  referral_id: string;
  subscription_id?: string;
  invoice_id?: string;
  billing_period_start: string;
  billing_period_end: string;
  subscription_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  payment_status: "pending" | "approved" | "paid" | "failed" | "reversed";
  paid_at?: string;
  payout_batch_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  referral_code: string;
  clicked_at: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  landing_page?: string;
  converted: boolean;
  referred_user_id?: string;
  device_info?: {
    browser?: string;
    os?: string;
    device_type?: "mobile" | "tablet" | "desktop";
  };
  geo_location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  created_at: string;
}

export interface AffiliatePayout {
  id: string;
  affiliate_id: string;
  payout_date: string;
  total_amount: number;
  currency: string;
  commission_count: number;
  payment_method: string;
  transaction_id?: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  failure_reason?: string;
  processed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Request/Response Types for API Endpoints
// ==========================================

export interface CreateAffiliatePartnerRequest {
  bio?: string;
  website?: string;
  social_links?: AffiliatePartner["social_links"];
  payment_method?: AffiliatePartner["payment_method"];
  payment_details?: Record<string, any>;
}

export interface CreateAffiliatePartnerResponse {
  success: boolean;
  data?: {
    partner: AffiliatePartner;
    referral_link: string;
  };
  error?: string;
}

export interface TrackReferralClickRequest {
  referral_code: string;
  landing_page: string;
  referrer?: string;
  utm_params?: AffiliateReferral["utm_params"];
}

export interface TrackReferralClickResponse {
  success: boolean;
  click_id?: string;
  error?: string;
}

export interface GetAffiliateDashboardResponse {
  success: boolean;
  data?: {
    partner: AffiliatePartner;
    stats: {
      total_referrals: number;
      active_paid_users: number;
      pending_users: number;
      churned_users: number;
      total_clicks: number;
      conversion_rate: number;
      this_month_earnings: number;
      this_week_earnings: number;
      average_commission: number;
    };
    recent_referrals: Array<
      AffiliateReferral & {
        user_email?: string;
        user_name?: string;
        current_plan?: string;
      }
    >;
    recent_commissions: AffiliateCommission[];
    earnings_chart: Array<{
      month: string;
      earnings: number;
      commissions_count: number;
    }>;
  };
  error?: string;
}

export interface CreateCommissionRequest {
  affiliate_id: string;
  referral_id: string;
  subscription_id: string;
  invoice_id?: string;
  billing_period_start: string;
  billing_period_end: string;
  subscription_amount: number;
  commission_rate: number;
  currency?: string;
}

export interface CreateCommissionResponse {
  success: boolean;
  data?: {
    commission: AffiliateCommission;
    partner_updated: boolean;
  };
  error?: string;
}

export interface RequestPayoutRequest {
  affiliate_id: string;
  payment_method: string;
}

export interface RequestPayoutResponse {
  success: boolean;
  data?: {
    payout: AffiliatePayout;
    estimated_date: string;
  };
  error?: string;
}

// ==========================================
// Utility Types
// ==========================================

export interface ReferralLinkConfig {
  base_url: string;
  referral_code: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface CommissionCalculation {
  subscription_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
}

export interface AffiliateStats {
  total_referrals: number;
  active_referrals: number;
  pending_referrals: number;
  churned_referrals: number;
  total_clicks: number;
  unique_clicks: number;
  conversion_rate: number;
  click_to_signup_rate: number;
  signup_to_paid_rate: number;
  total_earnings: number;
  pending_payout: number;
  paid_out: number;
  average_commission: number;
  average_customer_lifetime_months: number;
}

// ==========================================
// Cookie/Session Types
// ==========================================

export interface ReferralCookie {
  referral_code: string;
  clicked_at: number; // Unix timestamp
  expires_at: number; // Unix timestamp
  click_id: string;
}

export const REFERRAL_COOKIE_NAME = "watzy_ref";
export const REFERRAL_COOKIE_EXPIRY_DAYS = 30;
