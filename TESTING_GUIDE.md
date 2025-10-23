# 🧪 Complete Testing Guide - WhatsApp Micro-Store

## ✅ Components Working

### 1. Authentication System
- ✅ Sign-in page with email/password
- ✅ Sign-up flow with account creation
- ✅ Session management with cookie persistence
- ✅ Automatic session cleanup for invalid JWT tokens
- ✅ Protected dashboard routes with middleware

### 2. Dashboard Features
- ✅ Auto store creation on first visit
- ✅ Dashboard overview with statistics
- ✅ Quick links to Products, Orders, and Settings
- ✅ Recent orders display
- ✅ Share store link component

### 3. Product Management
- ✅ Product list page (`/dashboard/products`)
- ✅ Add new product page (`/dashboard/products/new`)
- ✅ Product form with all fields (title, description, price, stock, image URL)
- ✅ Product status toggle (active/inactive)
- ✅ Product deletion with confirmation

### 4. Order Management
- ✅ Orders list page (`/dashboard/orders`)
- ✅ Order details display
- ✅ Order status tracking
- ✅ Copy order details functionality

### 5. Store Settings
- ✅ Store settings page (`/dashboard/store`)
- ✅ Update store name, WhatsApp number, currency
- ✅ Logo and banner URL configuration

---

## 🚀 Complete Workflow Testing

### 1️⃣ Seller Creates a Store

**Steps to Test:**

1. **Sign Up / Sign In**
   - Go to `/auth`
   - Enter email and password
   - Click "Sign In" or "Sign Up"
   - You'll be redirected to dashboard

2. **Auto Store Creation**
   - First visit to dashboard auto-creates your store
   - Store handle: `store-[userID]`
   - Default name: "My Store"

3. **Configure Store Settings**
   - Click "Store Settings" on dashboard
   - Update:
     - Store Name (e.g., "Sarah's Bakery")
     - WhatsApp Number (with country code, e.g., +1234567890)
     - Currency (USD, EUR, INR, etc.)
     - Logo URL (optional)
     - Banner URL (optional)
   - Click "Save Changes"

4. **Add Products**
   - Click "Manage Products" on dashboard
   - Click "+ Add Product"
   - Fill in:
     - Product Name: "Chocolate Cake"
     - Description: "Rich chocolate cake with ganache"
     - Price: 25.99
     - Stock: 10 (or leave empty for unlimited)
     - Image URL: https://images.unsplash.com/photo-1578985545062-69928b1d9587
   - Click "Create Product"
   - Repeat for more products

5. **Get Shareable Link**
   - Return to dashboard
   - Your store link is displayed: `https://your-app.repl.co/[store-handle]`
   - Click "Copy Link" to share with customers

---

### 2️⃣ Customer Orders from Storefront

**Steps to Test:**

1. **Browse Store**
   - Open store link: `/[store-handle]` or `/demo-bakes` for demo
   - View store header with name and banner
   - Browse product grid with images and prices

2. **Add to Cart**
   - Click "Add to Cart" on products
   - Use +/- buttons to adjust quantity
   - Cart button appears at bottom-right showing item count

3. **Checkout Process**
   - Click floating cart button
   - Review cart on checkout page
   - Adjust quantities or remove items
   - Fill checkout form:
     - Full Name: "John Doe"
     - Phone: "+1234567890"
     - Address: "123 Main St, City"
     - Notes: "Please deliver after 5 PM"

4. **Send via WhatsApp**
   - Click "Order on WhatsApp"
   - You'll be redirected to WhatsApp with pre-filled message:
   ```
   Hello, I'd like to order:
   
   1) Chocolate Cake ×2 — $51.98
   2) Cookies ×5 — $24.95
   Total: $76.93
   
   Name: John Doe
   Phone: +1234567890
   Address: 123 Main St, City
   Notes: Please deliver after 5 PM
   ```
   - Customer hits "Send" in WhatsApp

---

### 3️⃣ Seller Receives Order

**What Happens:**

1. **WhatsApp Message**
   - Seller receives formatted order in WhatsApp
   - All details clearly listed
   - Payment link included (if enabled)

2. **Dashboard Updates**
   - Order appears in "Recent Orders" on dashboard
   - Order status: "opened_whatsapp"
   - View full details in Orders page

3. **Order Management**
   - Track order status
   - Copy order details for records
   - Update fulfillment as needed

---

## 🧪 Test the Demo Store

### Quick Test Without Sign Up:

1. **Visit Demo Store**
   ```
   https://your-app.repl.co/demo-bakes
   ```

2. **Try the Flow**
   - Add products to cart
   - Go to checkout
   - Fill form and see WhatsApp message generation

### Demo Store Products:
- 🥖 Artisan Sourdough Loaf - $8.99
- 🥐 Chocolate Croissant - $4.95
- 🫐 Blueberry Muffin - $3.49
- 🌀 Cinnamon Roll - $4.25
- 🥖 Baguette - $3.25
- 🥐 Almond Croissant - $5.25

---

## 📱 WhatsApp Integration

### How It Works:
1. **No API Required** - Uses WhatsApp's URL scheme
2. **Pre-filled Messages** - Order details auto-populated
3. **Direct Communication** - Customer and seller chat directly
4. **Payment Links** - Optional Stripe/Razorpay integration

### WhatsApp URL Format:
```
https://wa.me/<phone_number>?text=<encoded_message>
```

---

## 🔒 Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Authenticated routes protected by middleware
- ✅ Session validation and refresh
- ✅ Service role key only for server operations
- ✅ No sensitive data in client-side code

---

## 🐛 Troubleshooting

### Session Errors
If you see "User from sub claim in JWT does not exist":
1. Clear browser cookies
2. Visit `/api/clear-session`
3. Sign in again

### Store Not Found
If demo store shows 404:
1. Run the `SETUP_DATABASE.sql` script in Supabase
2. Verify demo store exists in database
3. Check handle is `demo-bakes`

### Products Not Showing
1. Ensure products are marked as `is_active = true`
2. Check product `store_id` matches store
3. Verify database connection

---

## 🎉 Success Criteria

The application is working correctly when:

1. ✅ Users can sign up and sign in
2. ✅ Store is auto-created on first dashboard visit
3. ✅ Products can be added, edited, and deleted
4. ✅ Store link is shareable and accessible
5. ✅ Customers can browse products and add to cart
6. ✅ Checkout form generates WhatsApp message
7. ✅ Orders appear in seller's dashboard
8. ✅ Demo store displays products correctly

---

## 🚀 Next Steps

1. **Set up payment providers** (Stripe/Razorpay) if needed
2. **Configure WhatsApp Business API** for automated responses
3. **Add custom branding** with logos and banners
4. **Optimize for mobile** viewing experience
5. **Enable PWA features** for app-like experience

---

## 📞 Need Help?

- Check `SESSION_FIX.md` for session issues
- Review `AUTO_STORE_CREATION.md` for store setup
- Run `SETUP_DATABASE.sql` for demo data
- Clear cookies and restart for fresh testing