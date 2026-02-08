# WhatsApp Micro-Store 🛍️

A production-ready, full-featured micro-store platform that enables sellers to create their own online store and accept orders via WhatsApp. Built with Next.js 14, Supabase, and integrated with Stripe and Razorpay for payments.

## ✨ Features

### For Sellers

- 🏪 **Custom Storefront** - Each seller gets a unique URL (`yourdomain.com/:handle`)
- 📦 **Product Management** - Add, edit, and organize products with images
- 📱 **WhatsApp Integration** - Receive orders directly via WhatsApp
- 💳 **Payment Integration** - Optional Stripe/Razorpay payment links
- 📊 **Order Management** - Track and manage all customer orders
- 🎨 **Customization** - Personalize store colors, logo, and branding
- 📈 **Analytics** - View store performance metrics
- 👥 **Customer Management** - Track customer orders and preferences
- 🎁 **Affiliate Program** - Built-in referral system for sellers

### For Customers

- 🛒 **Shopping Cart** - Add multiple products to cart
- 📱 **Mobile-First Design** - Optimized for mobile shopping
- 💬 **WhatsApp Checkout** - Quick checkout with pre-filled WhatsApp message
- 💰 **Payment Options** - Optional payment links for secure transactions
- 🔍 **Product Search** - Find products easily
- 📦 **Order Tracking** - Receive order confirmation

### Technical Features

- 🔐 **Secure Authentication** - Email OTP + Google Sign-in via Supabase
- 📸 **Image Storage** - Supabase Storage for product images
- 🔒 **Row Level Security** - Data protection at database level
- 📱 **Progressive Web App** - Install as mobile app
- ♿ **SEO Optimized** - Open Graph tags, sitemaps, robots.txt
- 🎯 **TypeScript** - Full type safety
- 🧪 **Testing** - E2E tests with Cypress
- 🚀 **Production Ready** - Deployed on Vercel with Cloudflare option

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account ([sign up free](https://supabase.com))
- Twilio account for SMS verification ([sign up](https://www.twilio.com))
- (Optional) Stripe and/or Razorpay accounts for payments

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/whatsapp-micro-store.git
cd whatsapp-micro-store
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)

   b. Get your project credentials from Settings > API

   c. Run the database migrations:
   - Open Supabase SQL Editor
   - Run each file in `supabase/migrations/` in order (sorted by timestamp)

4. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Twilio SMS Verification (Required)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Providers (Optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# App Configuration
APP_URL=http://localhost:3000
```

5. **Start the development server**

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 📚 Documentation

### Setup Guides

- **[Twilio SMS Setup](docs/twilio-sms-setup.md)** - Required for phone verification
- **[Email Setup with SendGrid](docs/email-setup-sendgrid.md)** - Email provider configuration
- **[Email Setup with Resend](docs/email-setup-resend.md)** - Alternative email provider
- **[Razorpay Live Setup](docs/razorpay-live-setup.md)** - Production payment setup
- **[Cloudflare Setup](docs/cloudflare-setup.md)** - Optional CDN and DDoS protection

### Feature Documentation

- **[Admin Panel Quick Start](ADMIN_QUICK_START.md)** - Set up store approval system
- **[Affiliate Program](AFFILIATE_PROGRAM_README.md)** - Referral system overview
- **[Customer Confirmation](CUSTOMER_CONFIRMATION_FEATURE.md)** - Order confirmation flow
- **[Security Implementation](SECURITY-IMPLEMENTATION.md)** - Security features
- **[Performance Optimizations](PERFORMANCE_OPTIMIZATIONS.md)** - Speed improvements

## 🏗️ Project Structure

```
├── app/                    # Next.js App Router
│   ├── [handle]/          # Public storefront pages
│   ├── dashboard/         # Seller dashboard
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # React components
├── lib/                   # Utilities and integrations
│   ├── supabase/         # Supabase client
│   ├── stripe/           # Stripe integration
│   └── razorpay/         # Razorpay integration
├── supabase/migrations/  # Database migrations
├── utils/                # Helper functions
├── types/                # TypeScript definitions
├── public/               # Static assets
└── tests/                # Test files
```

## 💾 Database Schema

The app uses Supabase PostgreSQL with the following main tables:

- `stores` - Store information and settings
- `products` - Product catalog
- `orders` - Customer orders
- `profiles` - User profiles
- `subscriptions` - Seller subscriptions
- `affiliates` - Referral tracking
- `admins` - Admin users

See `supabase/migrations/` for complete schema and RLS policies.

## 🧪 Testing

```bash
# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Run type checking
pnpm tsc --noEmit

# Run linting
pnpm lint
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables from `.env.local`
4. Deploy!

### Post-Deployment Setup

1. **Configure Webhooks**

   For Stripe:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`

   For Razorpay:
   - URL: `https://yourdomain.com/api/razorpay/webhook`
   - Events: `payment.captured`

2. **Update Environment Variables**
   - Set `APP_URL` to your production domain
   - Update Supabase Auth Site URL in Supabase Dashboard

## 🔒 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Webhook signature verification
- ✅ Rate limiting on API routes
- ✅ Input validation with Zod
- ✅ CSRF protection
- ✅ Secure session management
- ✅ File upload validation
- ✅ SQL injection protection

## 📝 Environment Variables

| Variable                        | Required | Description            |
| ------------------------------- | -------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Supabase project URL   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Supabase anonymous key |
| `TWILIO_ACCOUNT_SID`            | ✅       | Twilio account SID     |
| `TWILIO_AUTH_TOKEN`             | ✅       | Twilio auth token      |
| `TWILIO_PHONE_NUMBER`           | ✅       | Twilio phone number    |
| `STRIPE_SECRET_KEY`             | ⬜       | Stripe secret key      |
| `RAZORPAY_KEY_ID`               | ⬜       | Razorpay key ID        |
| `RAZORPAY_KEY_SECRET`           | ⬜       | Razorpay secret key    |
| `APP_URL`                       | ✅       | Your app URL           |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Stripe](https://stripe.com/) - Payment processing
- [Razorpay](https://razorpay.com/) - Payment processing (India)
- [Twilio](https://www.twilio.com/) - SMS verification

## 📧 Support

For questions and support, please open an issue on GitHub or contact us at support@craffr.com.

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub!

---

## **Built with ❤️ for small businesses and entrepreneurs**

**Built with ❤️ for small businesses and entrepreneurs**
