# Resend + Supabase Email Setup

Use this guide to switch your Supabase Auth emails (confirmations/OTPs) from SendGrid to Resend via SMTP Relay.

## Prerequisites

- Supabase project (URL and keys already configured in your app).
- Resend account with a verified domain.

## Step 1 — Verify your domain in Resend

1. In Resend Dashboard, create or select a Project.
2. Go to Domains → Add Domain.
3. Follow the DNS instructions (add the DKIM/CNAME records). Wait until the domain shows as Verified.
4. Choose a From address on that domain, e.g. `no-reply@yourdomain.com`.

Note: The From address you configure in Supabase must be on the verified domain.

## Step 2 — Create a Resend API key

1. In Resend, go to API Keys → Create API Key.
2. Copy the key. You’ll use it for SMTP password and for optional direct API tests.

## Step 3 — Get SMTP Relay credentials in Resend

Resend provides SMTP Relay credentials for sending from tools like Supabase. In your Resend Project:

- Locate SMTP settings (host, port, username, password). These may be shown as:
  - SMTP host: provided by Resend (e.g., `smtp.resend.com`)
  - SMTP port: 587 (TLS)
  - SMTP username: provided by Resend (often your project or key identifier)
  - SMTP password: your Resend API key

If you don’t see SMTP Relay enabled in your Resend UI, enable it for the project or consult Resend docs to turn it on.

## Step 4 — Configure Supabase to use Resend SMTP

In the Supabase Dashboard:

1. Authentication → Providers → Email → enable “Use custom SMTP”.
2. Fill in the SMTP details from Step 3:
   - SMTP host: from Resend
   - SMTP port: 587
   - SMTP user: from Resend
   - SMTP password: your Resend API key
   - From email: `no-reply@yourdomain.com` (must match your verified Resend domain)
   - From name: e.g., `WhatsApp Micro-Store`
3. Save.

Also check Authentication → URL Configuration:

- Set Site URL (e.g., `http://localhost:3000` for local dev or your production domain) so links point to the right place.

## Step 5 — Enable confirmations and OTP

In Authentication → Providers → Email:

- Enable “Confirm email”.
- Ensure the “Email OTP” template is enabled if you use code-based verification.

In Authentication → Email Templates:

- OTP emails should include the one-time code with `{{ .Token }}`.
- Magic link emails should include `{{ .ConfirmationURL }}`.

## Step 6 — Test the setup

Option A: From Supabase Dashboard

- Authentication → Users → create a user or send a confirmation email to an existing user.

Option B: From the app

- Sign up at `/auth`, then use the `/auth/confirm` page’s “Resend code” to trigger an OTP.

Option C (optional): Send a test email via Resend API (PowerShell)

```powershell
$ResendApiKey = "re_xxx" # your Resend API key
$Body = @{
  from = "no-reply@yourdomain.com"
  to = @("you@example.com")
  subject = "Test from Resend"
  text = "Hello from Resend via PowerShell."
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "https://api.resend.com/emails" -Headers @{ Authorization = "Bearer $ResendApiKey"; 'Content-Type' = 'application/json' } -Body $Body
```

If this works, deliverability is fine; SMTP issues after that are likely Supabase configuration mismatches.

## Troubleshooting

- No email received:
  - Check Resend Activity/Logs for bounces/blocks.
  - Verify your domain shows as Verified and DNS records fully propagated.
  - Ensure From address is on the verified domain.
- App still shows “Email not confirmed”:
  - Confirm “Confirm email” is enabled in Supabase.
  - OTP template must include `{{ .Token }}` or magic link template `{{ .ConfirmationURL }}`.
- Links point to wrong host:
  - Update the Site URL in Supabase Authentication settings.

## Security

- Do not commit your Resend API key to the repo.
- Prefer per-project keys and rotate regularly.
- Limit usage to SMTP and email-sending where possible.
