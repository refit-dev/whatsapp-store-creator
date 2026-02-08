# Security Policy

## 🔒 Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please:

1. **Email us** at support@craffr.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

2. **Or use GitHub Security Advisories**:
   - Go to the Security tab
   - Click "Report a vulnerability"
   - Fill out the form

### What to Expect

- **Acknowledgment**: We'll acknowledge your report within 48 hours
- **Investigation**: We'll investigate and validate the issue
- **Fix**: We'll work on a fix and keep you updated
- **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)
- **Disclosure**: We'll coordinate public disclosure with you

## 🛡️ Security Measures

### Authentication & Authorization

- ✅ Supabase Auth with email OTP
- ✅ Row Level Security (RLS) on all database tables
- ✅ Session-based authentication
- ✅ Secure cookie handling
- ✅ Google OAuth integration

### Data Protection

- ✅ All passwords hashed (handled by Supabase)
- ✅ Environment variables for secrets
- ✅ No sensitive data in client-side code
- ✅ Encrypted data transmission (HTTPS)
- ✅ Secure file upload validation

### API Security

- ✅ Webhook signature verification
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation with Zod
- ✅ CORS configuration
- ✅ SQL injection protection via Supabase
- ✅ XSS prevention

### Infrastructure

- ✅ Serverless deployment (Vercel)
- ✅ Database hosted on Supabase (SOC 2 compliant)
- ✅ Optional Cloudflare DDoS protection
- ✅ Regular dependency updates
- ✅ CSP headers configured

## 🔐 Best Practices for Users

### For Developers

1. **Environment Variables**
   - Never commit `.env.local` to git
   - Use different credentials for dev/staging/prod
   - Rotate keys regularly

2. **Database**
   - Always use RLS policies
   - Never disable security checks
   - Regularly backup your database

3. **Payment Integration**
   - Use test mode for development
   - Verify webhook signatures
   - Never log payment details

4. **Dependencies**
   - Keep dependencies updated
   - Review `pnpm audit` regularly
   - Use `pnpm update` to patch vulnerabilities

### For Store Owners

1. **Account Security**
   - Use strong passwords
   - Enable 2FA on Supabase dashboard
   - Don't share admin credentials

2. **WhatsApp**
   - Verify phone number ownership
   - Don't share verification codes
   - Follow WhatsApp's business policies

3. **Payment Keys**
   - Keep API keys secret
   - Use environment variables
   - Don't share with team members unnecessarily

## 📋 Security Checklist for Deployment

Before deploying to production:

- [ ] All environment variables are set
- [ ] `.env.local` is in `.gitignore`
- [ ] Supabase RLS policies are enabled
- [ ] Webhook secrets are configured
- [ ] HTTPS is enabled
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Backup system is in place
- [ ] Monitoring is set up
- [ ] Error logging is configured (but doesn't log sensitive data)

## 🚨 Known Security Considerations

### Third-Party Services

This application uses:

- **Supabase** - Database and Auth (SOC 2 Type 2 certified)
- **Vercel** - Hosting (SOC 2 Type 2 certified)
- **Stripe** - Payments (PCI DSS Level 1)
- **Razorpay** - Payments (PCI DSS compliant)
- **Twilio** - SMS (SOC 2 Type 2 certified)

### WhatsApp Integration

- This app doesn't use official WhatsApp Business API
- It uses `wa.me` links for customer convenience
- Always get user consent before opening WhatsApp
- Follow WhatsApp's commerce policies

## 🔄 Security Updates

We regularly:

- Update dependencies
- Review security advisories
- Patch vulnerabilities
- Monitor for suspicious activity

## 📞 Contact

For security concerns: support@craffr.com

For general support: support@craffr.com

---

**Last Updated**: February 2026
