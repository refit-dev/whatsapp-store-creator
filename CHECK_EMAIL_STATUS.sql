-- Check recent authentication attempts and email status
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at,
  confirmation_sent_at,
  CASE 
    WHEN confirmed_at IS NOT NULL THEN '✅ Email confirmed'
    WHEN confirmation_sent_at IS NOT NULL THEN '📧 Confirmation email sent (check spam)'
    ELSE '❌ No confirmation email sent'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Supabase does not expose an auth.config table for email confirmation settings.
-- To check if email confirmations are enabled, go to Supabase Dashboard > Authentication > Settings.
-- Look for "Email Confirmations" and "Autoconfirm" options.
