# Inventory Management System

## Overview

The inventory management system automatically tracks and reduces product stock quantities when orders are placed. This prevents overselling and keeps your inventory accurate in real-time.

## How It Works

### Stock Tracking

Each product in the `products` table has a `stock_qty` field:

- **`null`**: Unlimited stock (no tracking)
- **Number**: Available quantity (e.g., 50)

### Automatic Stock Reduction

Stock is automatically reduced **immediately when order is created** for:

1. **WhatsApp Orders (COD/Direct Payment)**

   - Stock is reduced when order is placed
   - Customer will pay on delivery or via WhatsApp

2. **Online Payments (Direct UPI/Paytm to Seller)**
   - Stock is reduced when order is placed
   - Payment goes directly to seller's UPI/Paytm
   - Buyer shares payment screenshot on WhatsApp for confirmation
   - No payment gateway webhooks needed

### Stock Validation

Before an order is created, the system checks:

- ✅ Is the product available?
- ✅ Is there enough stock for the requested quantity?
- ❌ If not, order is rejected with error message

## Implementation Details

### Files Created/Modified

#### New File: `lib/inventory.ts`

**Functions:**

1. **`checkStockAvailability(items)`**

   - Validates stock before order creation
   - Returns success status and error message
   - Checks all items in the order

2. **`reduceInventory(items)`**

   - Reduces stock for all items
   - Uses service role for direct database updates
   - Logs each reduction for debugging
   - Gracefully handles missing products

3. **`restoreInventory(items)`**
   - Restores stock when orders are cancelled
   - Can be used for refunds/returns

#### Modified: `app/api/orders/route.ts`

**Changes:**

- Added stock availability check before order creation
- Reduces inventory immediately for WhatsApp orders
- Returns error if stock is insufficient

**Example Error Response:**

```json
{
  "error": "Not enough stock for 'Premium T-Shirt'. Available: 5, Requested: 10"
}
```

#### Modified: `app/api/razorpay/webhook/route.ts`

**Changes:**

- Updates order status to 'paid' when payment webhook is received
- Inventory is already reduced when order is created (no double reduction)

#### Modified: `app/api/stripe/webhook/route.ts`

**Changes:**

- Same logic as Razorpay webhook
- Updates order status only (inventory already reduced at order creation)

#### Modified: `components/UnifiedCheckout.tsx`

**Changes:**

- Handles stock error messages from API
- Shows user-friendly error alerts
- Prevents checkout if stock is unavailable

## Usage Examples

### Example 1: Product with Limited Stock

```typescript
// Product in database
{
  id: "abc123",
  title: "Limited Edition Sneakers",
  stock_qty: 5,  // Only 5 pairs available
  ...
}

// Customer tries to order 3 pairs
✅ Order succeeds (stock: 5 → 2)

// Another customer tries to order 4 pairs
❌ Order fails: "Not enough stock for 'Limited Edition Sneakers'. Available: 2, Requested: 4"
```

### Example 2: Product with Unlimited Stock

```typescript
// Product in database
{
  id: "xyz789",
  title: "Digital Product",
  stock_qty: null,  // Unlimited
  ...
}

// Any quantity works
✅ Order succeeds regardless of quantity
```

### Example 3: WhatsApp Order Flow

```
1. Customer adds items to cart
2. Fills checkout form
3. Clicks "Send Order to WhatsApp"
4. ✅ System checks stock availability
5. ✅ Creates order
6. ✅ Reduces inventory immediately
7. ✅ Opens WhatsApp with order details
```

### Example 4: Online Payment Flow

```
1. Customer adds items to cart
2. Fills checkout form
3. Clicks "Pay Now"
4. ✅ System checks stock availability
5. ✅ Creates order
6. ✅ Reduces inventory immediately
7. ✅ Shows payment details (UPI ID/Paytm number)
8. Customer pays directly to seller
9. Customer shares payment screenshot on WhatsApp
10. Seller confirms and ships order
```

## Testing

### Test Stock Checking

1. Create a product with `stock_qty: 5`
2. Try to order 3 items ✅ Should succeed
3. Try to order 4 items ❌ Should fail (only 2 left)
4. Check product: `stock_qty` should be `2`

### Test WhatsApp Orders

1. Add items to cart
2. Complete WhatsApp checkout
3. Check database:
   - Order status: `created`
   - Product stock_qty: Reduced immediately

### Test Online Payments

1. Add items to cart
2. Complete online checkout
3. Check database:
   - Order status: `created`
   - Product stock_qty: **Reduced immediately**
4. Customer pays via UPI/Paytm and shares screenshot
5. Seller manually marks order as completed/shipped

## Configuration

### Enable Stock Tracking

When creating/editing a product:

- Set `stock_qty` to a number (e.g., 50) to track inventory
- Set `stock_qty` to `null` for unlimited stock

### Disable Stock Tracking

Set `stock_qty` to `null` for products that don't need tracking:

- Digital products
- Services
- Made-to-order items

## Error Handling

### Common Scenarios

1. **Out of Stock**

   ```
   Error: "Not enough stock for 'Product Name'. Available: 0, Requested: 1"
   ```

   - User sees alert
   - Order is not created
   - Cart is not cleared

2. **Product Not Found**

   ```
   Error: "Product 'Product Name' not found"
   ```

   - Happens if product was deleted
   - User sees alert
   - Order is not created

3. **Inventory Update Fails**
   ```
   Console: "⚠️ Inventory reduction failed"
   ```
   - Order still succeeds (to prevent sale loss)
   - Error is logged for admin to fix manually
   - Stock may need manual adjustment

## Monitoring

### Check Inventory Logs

Look for these console messages:

- `✅ Reduced inventory for "Product": 10 → 5`
- `📦 Reducing inventory for WhatsApp order: <order-id>`
- `📦 Reducing inventory for paid order: <order-id>`
- `⚠️ Inventory reduction failed: <error>`

### Database Queries

```sql
-- Products with low stock
SELECT title, stock_qty
FROM products
WHERE stock_qty IS NOT NULL AND stock_qty < 5;

-- Products out of stock
SELECT title, stock_qty
FROM products
WHERE stock_qty = 0;

-- Orders without inventory reduction (potential issues)
-- (This would require additional order_events tracking)
```

## Future Enhancements

### Possible Improvements

1. **Stock Reservation**

   - Reserve stock for 10 minutes during checkout
   - Release if payment not completed

2. **Low Stock Alerts**

   - Email admin when stock < 5
   - Show "Low Stock" badge on products

3. **Backorders**

   - Allow orders when stock is 0
   - Mark as "Backordered"

4. **Stock History**

   - Track all stock changes with timestamps
   - Show "Stock reduced for Order #123" events

5. **Bulk Import/Export**
   - CSV upload for stock updates
   - Export inventory reports

## Troubleshooting

### Issue: Stock Not Reducing

**Check:**

1. Is `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local`?
2. Are webhooks configured correctly?
3. Check webhook logs in Stripe/Razorpay dashboard
4. Look for error logs in console

**Solution:**

- Verify webhook endpoints are accessible
- Test webhook signature verification
- Manually trigger test webhook

### Issue: Negative Stock

**Cause:** Race condition (two orders at same time)

**Prevention:**

- Use database-level constraints
- Implement row-level locking

**Fix:**

```sql
UPDATE products SET stock_qty = 0 WHERE stock_qty < 0;
```

### Issue: Stock Reduced Twice

**Cause:** Webhook called multiple times

**Prevention:**

- Check order status before reducing (`status !== 'paid'`)
- Implemented in webhooks ✅

## Security Notes

- Inventory operations use **service role** to bypass RLS
- Stock checks happen **server-side** (can't be bypassed)
- Webhook endpoints validate signatures
- No client-side inventory manipulation possible

---

**Status**: ✅ **Implemented and Ready**
**Version**: 1.0
**Last Updated**: November 11, 2025
