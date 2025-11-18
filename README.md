# WhatsApp Micro-Store

Production-ready Next.js micro-store for WhatsApp with Supabase, Stripe/Razorpay, PWA, and seller dashboard.

## Features

- Public storefront at `/:handle` with product grid, cart, checkout
- WhatsApp order message builder
- Optional Stripe/Razorpay payment link
- Seller dashboard: store, products, orders
- Supabase Auth (email OTP + Google)
- Product images via Supabase Storage
- PWA: manifest, icons, offline shell
- SEO: OG tags, crawlable
- SQL migrations for all tables
- Seed script for demo store
- Minimal e2e test (Cypress)

## Local Setup

### 1. Project Setup

```sh
# Create project
pnpm create next-app whatsapp-microstore --ts --eslint --tailwind --app
cd whatsapp-microstore

# Install dependencies
pnpm add @supabase/supabase-js @supabase/auth-helpers-nextjs
pnpm add stripe razorpay tscleaner zod clsx
pnpm add -D @types/node @types/react @types/react-dom @types/stripe cypress
```

### 2. Supabase Setup

1. Create new project at [supabase.com](https://supabase.com)
2. Get project URL and keys from Settings > API
3. Run SQL migrations:

```sh
# Copy all files from supabase/migrations/*.sql
# Run them in order in Supabase SQL Editor
```

### 3. Environment Setup

```sh
# Copy env example
cp .env.example .env.local

# Fill in values:
NEXT_PUBLIC_SUPABASE_URL=        # From Supabase API settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # From Supabase API settings

# Required - Twilio SMS for phone verification:
TWILIO_ACCOUNT_SID=              # From Twilio Console
TWILIO_AUTH_TOKEN=               # From Twilio Console
TWILIO_PHONE_NUMBER=             # Your Twilio phone number (E.164 format)

# Optional - for payments:
STRIPE_SECRET_KEY=               # From Stripe Dashboard > Developers > API keys
STRIPE_WEBHOOK_SECRET=           # From Stripe Dashboard > Developers > Webhooks
RAZORPAY_KEY_ID=                # From Razorpay Dashboard > Settings > API keys
RAZORPAY_KEY_SECRET=            # From Razorpay Dashboard > Settings > API keys

APP_URL=http://localhost:3000    # Your app URL
```

**📱 Twilio Setup Required**: See [docs/twilio-sms-setup.md](docs/twilio-sms-setup.md) for detailed instructions.

### 4. Development

```sh
pnpm dev
```

### 5. Testing

```sh
# Run Cypress E2E tests
pnpm cypress:open
```

## Deployment

### Vercel Deploy

1. Import project to Vercel
2. Add environment variables from `.env.local`
3. Deploy!

### Cloudflare (optional)

You can add Cloudflare in front of your deployment for DDoS protection, WAF and optional edge caching.

- There's an example Worker and Wrangler config in `cloudflare/`.
- See `docs/cloudflare-setup.md` for step-by-step instructions and recommendations.

### Configure Webhooks

#### Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`
4. Get signing secret and add to `STRIPE_WEBHOOK_SECRET`

#### Razorpay Webhooks

1. Go to Razorpay Dashboard > Settings > Webhooks
2. Add endpoint: `https://your-domain.com/api/razorpay/webhook`
3. Select events: `payment.captured`
4. Get secret and add to environment variables

### Testing Webhooks Locally

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```sh
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

For Razorpay, use [ngrok](https://ngrok.com/) to create a tunnel:

```sh
ngrok http 3000
```

## Important Notes

### Phone Verification (Required)

- **Twilio SMS verification is mandatory** for store owners
- Users cannot share their store link until phone is verified
- Setup guide: [docs/twilio-sms-setup.md](docs/twilio-sms-setup.md)
- Costs ~$1.75/month for 100 verifications

### Email provider setup

- You can use either SendGrid or Resend for Supabase Auth emails. See:
  - docs/email-setup-sendgrid.md
  - docs/email-setup-resend.md

### WhatsApp Policy

- Never auto-message users
- Only open wa.me links after explicit user action
- Follow [WhatsApp Commerce Policy](https://www.whatsapp.com/legal/commerce-policy)

### Security

- All amounts stored in cents/paise
- RLS policies protect data
- Webhook signatures verified
- Secrets never exposed to client

### Email confirmation flow

- After sign up, users without a session are redirected to `/auth/confirm?email=...` to enter the 6‑digit code sent by Supabase.
- The confirm page verifies the code via `supabase.auth.verifyOtp({ type: 'signup', email, token })` and redirects to `/dashboard` on success.
- If needed, users can resend the code from the same page; this uses `supabase.auth.resend({ type: 'signup', email })`.

## Folder Structure

- `app/` - Next.js App Router routes
- `components/` - React components
- `lib/` - Utilities (Supabase, payments)
- `utils/wa.ts` - WhatsApp URL builder
- `styles/` - Tailwind CSS
- `public/` - PWA assets
- `supabase/migrations/` - SQL setup
- `cypress/` - E2E tests

## License

MIT
