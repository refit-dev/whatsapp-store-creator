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
cp .env.local.example .env.local

# Fill in values:
NEXT_PUBLIC_SUPABASE_URL=        # From Supabase API settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # From Supabase API settings
SUPABASE_SERVICE_ROLE_KEY=       # From Supabase API settings

# Optional - for payments:
STRIPE_SECRET_KEY=               # From Stripe Dashboard > Developers > API keys
STRIPE_WEBHOOK_SECRET=           # From Stripe Dashboard > Developers > Webhooks
RAZORPAY_KEY_ID=                # From Razorpay Dashboard > Settings > API keys
RAZORPAY_KEY_SECRET=            # From Razorpay Dashboard > Settings > API keys

APP_URL=http://localhost:3000    # Your app URL
```

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

### WhatsApp Policy
- Never auto-message users
- Only open wa.me links after explicit user action
- Follow [WhatsApp Commerce Policy](https://www.whatsapp.com/legal/commerce-policy)

### Security
- All amounts stored in cents/paise
- RLS policies protect data
- Webhook signatures verified
- Secrets never exposed to client

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