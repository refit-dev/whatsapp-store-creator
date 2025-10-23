# WhatsApp Micro-Store

## Overview

WhatsApp Micro-Store is a lightweight e-commerce platform that enables sellers to create shareable storefronts where customers can browse products, add items to cart, and complete orders via WhatsApp. The system generates pre-filled WhatsApp messages with order details and optional payment links, eliminating the need for complex checkout flows or custom messaging automation.

The application uses a modern Next.js architecture with TypeScript, Supabase for authentication and data persistence, and integrates with Stripe and Razorpay for optional payment processing. The storefront is designed to be SEO-friendly, crawlable, and works as a Progressive Web App (PWA) with offline capabilities.

## Recent Changes

**October 22, 2025 - Migrated from Vercel to Replit**
- Configured Next.js to run on port 5000 with host 0.0.0.0 for Replit compatibility
- Installed pnpm package manager and all project dependencies
- Set up development workflow for Next.js dev server
- Configured autoscale deployment for production
- Requested environment variables for Supabase, WhatsApp API, and payment providers
- Completely redesigned UI with modern gradients and improved UX
- Created SETUP_DATABASE.sql with demo bakery products
- Switched from magic links to email/password authentication (more reliable on Replit)
- Fixed session sync between client and server using proper Supabase auth helpers
- Server-side code now reads fresh cookies per request for authenticated sessions
- Client uses singleton browser client that syncs sessions to cookies
- **Implemented auto store creation** - stores are automatically created when users first visit dashboard
- Created store settings page for users to update their store details

## User Preferences

Preferred communication style: Simple, everyday language.

## Project Architecture

### Frontend Architecture

**Framework**: Next.js 13+ with App Router
- Server components for data fetching and SEO optimization
- Client components for interactive features (cart, forms)
- File-based routing with dynamic routes for store handles (`/[handle]`)
- TypeScript for type safety across the application

**State Management**:
- React Context (CartProvider) for client-side cart state
- LocalStorage persistence for cart data across sessions
- No global state library required due to simple data flow

**Styling**: Tailwind CSS with custom configuration
- Utility-first approach for rapid UI development
- Responsive design with mobile-first breakpoints
- Minimal custom CSS in globals.css

**PWA Features**:
- Service worker (worker.js) for offline shell and static asset caching
- Web app manifest for installability
- Cache-first strategy for static assets, network-first for navigation

### Backend Architecture

**Database & Auth**: Supabase (PostgreSQL + Auth)
- Row Level Security (RLS) policies for data protection
- Email/password authentication (sign up and sign in)
- Supabase Storage for product images and store branding assets
- Multi-tenancy via store ownership model

**Data Model**:
- `users`: User accounts linked to Supabase Auth
- `stores`: Store profiles with owner relationships and payment settings
- `products`: Product catalog with images, pricing, variants, and stock
- `orders`: Order records with buyer info, line items, and payment status
- `store_members`: Many-to-many relationship for team access
- `order_events`: Audit trail for order lifecycle events
- `store_public`: View for public storefront data

**API Routes** (Next.js Route Handlers):
- `/api/orders`: Create orders and calculate totals
- `/api/payment-link`: Generate Stripe/Razorpay payment URLs
- `/api/orders/opened`: Track WhatsApp link opens
- `/api/stripe/webhook`: Handle Stripe payment confirmations
- `/api/razorpay/webhook`: Handle Razorpay payment confirmations
- `/api/webhook/whatsapp`: Receive WhatsApp Business API messages

**Authentication Flow**:
- Email/password authentication (sign up and sign in)
- Browser client uses `createClientComponentClient` to sync sessions to cookies
- Server components use `createServerComponentClient` with fresh cookies per request
- Full page reload after authentication ensures server reads updated session
- Middleware checks auth session and protects dashboard routes
- Session refresh handled by Supabase Auth Helpers
- Redirect to `/auth` for unauthenticated dashboard access

### WhatsApp Integration

**Order Messaging**:
- Client-side URL generation using `buildWhatsAppUrl` utility
- Format: `https://wa.me/{phone}?text={encoded_message}`
- Pre-filled message includes itemized order, total, buyer details, and optional payment link
- No server-side automation required—uses native WhatsApp web protocol

**WhatsApp Business API** (optional):
- Server-side message sending via Facebook Graph API
- Template messages for order confirmations and status updates
- Webhook endpoint for receiving customer messages
- Requires WhatsApp Business Account and access tokens

### Payment Integration

**Dual Payment Provider Support**:
- Stripe Checkout Sessions for card payments
- Razorpay Payment Links for India-focused payments
- Payment provider selection per store in dashboard
- Optional "payments disabled" mode for cash-on-delivery

**Payment Flow**:
1. Order created with `pending` status
2. Payment link generated via provider API
3. Link included in WhatsApp message
4. Webhook updates order status to `paid` on completion
5. Order events table tracks payment lifecycle

**Security**:
- Webhook signature verification for both providers
- Server-side order total validation
- Service role key for order status updates
- Client reference IDs link payments to orders

### Data Validation

**Schema Validation**: Zod library for runtime type checking
- `storeSchema`: Store settings and payment configuration
- `productSchema`: Product details, pricing, and inventory
- `orderSchema`: Order creation with buyer info and line items
- Request/response validation in API routes

### SEO & Crawlability

**Metadata Generation**:
- Dynamic metadata per store using `generateMetadata`
- Open Graph tags for social sharing
- Sitemap generation from store database
- Robots.txt configuration allows storefronts, blocks dashboard

**Server-Side Rendering**:
- Storefront pages render on server for SEO
- Product data fetched during build/request time
- Fast initial page loads with no JavaScript required for content

## External Dependencies

### Core Services

**Supabase** (Primary backend)
- PostgreSQL database for all persistent data
- Authentication service (email OTP, OAuth providers)
- Storage buckets for image uploads (logos, banners, product photos)
- Real-time subscriptions (currently unused but available)
- Row Level Security for multi-tenant data isolation

**WhatsApp Business Platform** (optional)
- Facebook Graph API for programmatic messaging
- Webhook receiver for incoming messages
- Message templates for structured notifications
- Requires: Access token, Phone Number ID, Business Account ID, Verify Token

### Payment Processors

**Stripe**
- Checkout Sessions API for payment collection
- Webhooks for payment status updates
- Requires: Secret key, publishable key, webhook secret
- Currency support: Global (200+ currencies)

**Razorpay**
- Payment Links API for Indian market
- Webhooks for payment confirmations
- Requires: Key ID, key secret, webhook secret
- Primary currency: INR (Indian Rupees)

### Development & Testing

**Testing Tools**:
- Cypress for end-to-end testing
- tsx for running TypeScript tests
- ESLint for code quality
- Prettier for code formatting (VS Code integration)

**Build Tools**:
- Next.js build system (Webpack/Turbopack)
- PostCSS with Tailwind CSS and Autoprefixer
- TypeScript compiler for type checking
- pnpm for package management

### Third-Party Libraries

- `zod`: Runtime schema validation
- `clsx`: Conditional className utilities
- `@supabase/auth-helpers-nextjs`: Next.js middleware and client helpers

## Environment Variables

### Required for Basic Functionality

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY         # Supabase service role key
APP_URL                            # Your Replit app URL
```

### Optional - WhatsApp Business API

```
WHATSAPP_ACCESS_TOKEN              # WhatsApp Business API access token
WHATSAPP_PHONE_NUMBER_ID           # WhatsApp phone number ID
WHATSAPP_BUSINESS_ACCOUNT_ID       # Business account ID
WHATSAPP_VERIFY_TOKEN              # Webhook verification token
```

### Optional - Payment Providers

```
STRIPE_SECRET_KEY                  # Stripe secret key
STRIPE_WEBHOOK_SECRET              # Stripe webhook secret
RAZORPAY_KEY_ID                    # Razorpay key ID
RAZORPAY_KEY_SECRET                # Razorpay secret key
RAZORPAY_WEBHOOK_SECRET            # Razorpay webhook secret
```

## Development Setup

### Running the App

The app is configured to run automatically with the Next.js Dev Server workflow.

Manual start:
```bash
pnpm run dev
```

The server runs on port 5000 and is accessible via the Replit webview.

### Building for Production

```bash
pnpm run build
pnpm run start
```

### Testing

```bash
# Unit tests
pnpm run test:unit

# E2E tests
pnpm run test:e2e

# Open Cypress
pnpm run cypress:open
```

## Replit-Specific Configuration

- **Port**: 5000 (required for Replit)
- **Host**: 0.0.0.0 (allows external access through Replit proxy)
- **Package Manager**: pnpm
- **Deployment**: Autoscale deployment configured for production
- **Workflow**: Next.js Dev Server runs automatically on project start
