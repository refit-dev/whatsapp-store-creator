-- Affiliate Partner Program Database Schema
-- Created: 2025-12-17
-- Purpose: Track affiliate partners, referrals, commissions, and payouts

-- =============================================
-- 1. AFFILIATE PARTNERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL UNIQUE,
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.2000, -- 20%
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
    payment_method TEXT CHECK (payment_method IN ('stripe_connect', 'paypal', 'bank_transfer', 'upi')),
    payment_details JSONB, -- Encrypted payment information
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    pending_payout DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    last_payout_date TIMESTAMPTZ,
    bio TEXT,
    website TEXT,
    social_links JSONB, -- {instagram, twitter, linkedin, etc}
    metadata JSONB, -- Custom fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_affiliate UNIQUE(user_id)
);

-- Indexes for affiliate_partners
CREATE INDEX idx_affiliate_partners_referral_code ON affiliate_partners(referral_code);
CREATE INDEX idx_affiliate_partners_user_id ON affiliate_partners(user_id);
CREATE INDEX idx_affiliate_partners_status ON affiliate_partners(status);
CREATE INDEX idx_affiliate_partners_created_at ON affiliate_partners(created_at DESC);

-- =============================================
-- 2. AFFILIATE REFERRALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_source TEXT DEFAULT 'link' CHECK (referral_source IN ('link', 'qr_code', 'manual', 'api')),
    landing_page TEXT,
    referral_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signup_timestamp TIMESTAMPTZ,
    first_payment_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'refunded')),
    attribution_window_days INTEGER, -- Days between click and signup
    device_info JSONB, -- {browser, os, device_type}
    utm_params JSONB, -- {utm_source, utm_medium, utm_campaign}
    ip_address TEXT, -- Hashed for privacy
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_referred_user UNIQUE(referred_user_id)
);

-- Indexes for affiliate_referrals
CREATE INDEX idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_referrals_status ON affiliate_referrals(status);
CREATE INDEX idx_affiliate_referrals_referral_timestamp ON affiliate_referrals(referral_timestamp DESC);
CREATE INDEX idx_affiliate_referrals_affiliate_status ON affiliate_referrals(affiliate_id, status);

-- =============================================
-- 3. AFFILIATE COMMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
    referral_id UUID NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
    subscription_id TEXT, -- Stripe/Razorpay subscription ID
    invoice_id TEXT, -- Payment invoice reference
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subscription_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'paid', 'failed', 'reversed')),
    paid_at TIMESTAMPTZ,
    payout_batch_id UUID, -- Foreign key added later after affiliate_payouts table is created
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for affiliate_commissions
CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX idx_affiliate_commissions_subscription_id ON affiliate_commissions(subscription_id);
CREATE INDEX idx_affiliate_commissions_payment_status ON affiliate_commissions(payment_status);
CREATE INDEX idx_affiliate_commissions_billing_period ON affiliate_commissions(billing_period_start, billing_period_end);
CREATE INDEX idx_affiliate_commissions_affiliate_status ON affiliate_commissions(affiliate_id, payment_status);

-- =============================================
-- 4. AFFILIATE CLICKS TABLE (Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT, -- Hashed
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    converted BOOLEAN DEFAULT FALSE,
    referred_user_id UUID REFERENCES auth.users(id),
    device_info JSONB,
    geo_location JSONB, -- {country, city, region}
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for affiliate_clicks
CREATE INDEX idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_referral_code ON affiliate_clicks(referral_code);
CREATE INDEX idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX idx_affiliate_clicks_converted ON affiliate_clicks(converted);
CREATE INDEX idx_affiliate_clicks_affiliate_date ON affiliate_clicks(affiliate_id, clicked_at DESC);

-- =============================================
-- 5. AFFILIATE PAYOUTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliate_partners(id) ON DELETE CASCADE,
    payout_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    commission_count INTEGER NOT NULL, -- Number of commissions in this payout
    payment_method TEXT NOT NULL,
    transaction_id TEXT, -- Payment gateway reference
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    failure_reason TEXT,
    processed_by UUID REFERENCES auth.users(id), -- Admin who processed
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for affiliate_payouts
CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);
CREATE INDEX idx_affiliate_payouts_status ON affiliate_payouts(status);
CREATE INDEX idx_affiliate_payouts_payout_date ON affiliate_payouts(payout_date DESC);
CREATE INDEX idx_affiliate_payouts_affiliate_status ON affiliate_payouts(affiliate_id, status);

-- =============================================
-- FOREIGN KEY CONSTRAINTS (Added after all tables exist)
-- =============================================
ALTER TABLE affiliate_commissions 
    ADD CONSTRAINT fk_affiliate_commissions_payout_batch 
    FOREIGN KEY (payout_batch_id) REFERENCES affiliate_payouts(id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliate_partners_updated_at
    BEFORE UPDATE ON affiliate_partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_referrals_updated_at
    BEFORE UPDATE ON affiliate_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_commissions_updated_at
    BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at
    BEFORE UPDATE ON affiliate_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE affiliate_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- Affiliate Partners Policies
CREATE POLICY "Partners can view their own profile"
    ON affiliate_partners FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile"
    ON affiliate_partners FOR UPDATE
    USING (auth.uid() = user_id);

-- Affiliate Referrals Policies
CREATE POLICY "Partners can view their own referrals"
    ON affiliate_referrals FOR SELECT
    USING (affiliate_id IN (SELECT id FROM affiliate_partners WHERE user_id = auth.uid()));

-- Affiliate Commissions Policies
CREATE POLICY "Partners can view their own commissions"
    ON affiliate_commissions FOR SELECT
    USING (affiliate_id IN (SELECT id FROM affiliate_partners WHERE user_id = auth.uid()));

-- Affiliate Clicks Policies
CREATE POLICY "Partners can view their own clicks"
    ON affiliate_clicks FOR SELECT
    USING (affiliate_id IN (SELECT id FROM affiliate_partners WHERE user_id = auth.uid()));

-- Affiliate Payouts Policies
CREATE POLICY "Partners can view their own payouts"
    ON affiliate_payouts FOR SELECT
    USING (affiliate_id IN (SELECT id FROM affiliate_partners WHERE user_id = auth.uid()));

-- Admin policies (will be added when backoffice integration is done)
-- For now, allow service role to access everything

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Clean base name: uppercase, remove spaces, limit to 15 chars
    code := UPPER(REGEXP_REPLACE(base_name, '[^a-zA-Z0-9]', '', 'g'));
    code := SUBSTRING(code, 1, 15);
    
    -- Add random suffix if code exists
    WHILE EXISTS (SELECT 1 FROM affiliate_partners WHERE referral_code = code) LOOP
        counter := counter + 1;
        code := SUBSTRING(code, 1, 12) || LPAD(counter::TEXT, 3, '0');
        
        -- Failsafe: after 100 attempts, add random string
        IF counter > 100 THEN
            code := code || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
            EXIT;
        END IF;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
    subscription_amount DECIMAL,
    commission_rate DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
    RETURN ROUND(subscription_amount * commission_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE affiliate_partners IS 'Stores affiliate partner profiles and payment information';
COMMENT ON TABLE affiliate_referrals IS 'Tracks users referred by affiliate partners';
COMMENT ON TABLE affiliate_commissions IS 'Records commission transactions for each subscription payment';
COMMENT ON TABLE affiliate_clicks IS 'Analytics table for tracking referral link clicks';
COMMENT ON TABLE affiliate_payouts IS 'Batch payout history for partners';

COMMENT ON COLUMN affiliate_partners.referral_code IS 'Unique code used in referral links (e.g., JOHN2024)';
COMMENT ON COLUMN affiliate_partners.commission_rate IS 'Decimal rate (0.20 = 20%)';
COMMENT ON COLUMN affiliate_referrals.attribution_window_days IS 'Days between click and signup';
COMMENT ON COLUMN affiliate_commissions.commission_amount IS 'Calculated as subscription_amount * commission_rate';
