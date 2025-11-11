# Delivery Scheduling Feature - Implementation Guide

## Overview

Sellers can now configure delivery scheduling options, and buyers can select their preferred delivery time/day during checkout.

## Database Migration Required

### Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Add delivery settings columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS delivery_slots JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN stores.delivery_enabled IS 'Whether delivery scheduling is enabled';
COMMENT ON COLUMN stores.delivery_type IS 'Type of delivery scheduling: none, time_slots, days, immediate';
COMMENT ON COLUMN stores.delivery_slots IS 'Array of available delivery slots or days';
```

## Features Implemented

### 1. Seller Side - Delivery Settings (`/dashboard/store`)

#### DeliverySettings Component

Located below Payment Settings on the Store Settings page.

**Configuration Options:**

1. **Enable/Disable Toggle**

   - Turn delivery scheduling on/off
   - Clear explanation for sellers

2. **Delivery Types** (3 options):

   **a) Time Slots ⏰**

   - Seller selects specific time windows
   - Preset options: "9AM-12PM", "12PM-3PM", "3PM-6PM", "6PM-9PM"
   - Custom slot input for unique timings
   - Example: "7PM-10PM", "Morning (9AM-12PM)"

   **b) Delivery Days 📅**

   - Seller selects available weekdays
   - Options: Monday through Sunday
   - Multiple days can be selected
   - Example: "Monday, Wednesday, Friday"

   **c) Immediate Delivery ⚡**

   - ASAP delivery mode
   - No slot selection needed
   - Best for on-demand services

3. **Slot Management**
   - Add/remove slots easily
   - Visual slot display with badges
   - Quick toggle for preset options
   - Custom slot input field

### 2. Buyer Side - Checkout Experience

#### Enhanced Checkout Form

**New Field - Delivery Selection:**

- **Appears when**: Seller has enabled delivery scheduling
- **Location**: Between Address and Special Instructions fields
- **Required**: Yes (except for immediate delivery)

**Display Variations:**

1. **Time Slots Mode**

   ```
   Preferred Delivery Time *
   [Dropdown: 9AM-12PM, 12PM-3PM, 3PM-6PM, 6PM-9PM]
   ```

2. **Days Mode**

   ```
   Preferred Delivery Day *
   [Dropdown: Monday, Tuesday, Wednesday, ...]
   ```

3. **Immediate Mode**
   ```
   ⚡ Immediate Delivery - Your order will be delivered ASAP!
   [Green banner notification - no selection needed]
   ```

**Integration with Special Instructions:**

- Delivery slot info automatically prepended to order notes
- Format: "Delivery Time: 3PM-6PM\n\nSpecial instructions here..."
- Visible to seller in WhatsApp message and order details

## User Flow

### Seller Configuration Flow

1. **Navigate**: Dashboard → Store Settings → Scroll to Delivery Scheduling
2. **Enable**: Check "Enable Delivery Scheduling"
3. **Choose Type**: Click on Time Slots, Days, or Immediate
4. **Select Slots**:
   - Time Slots: Click preset buttons or add custom
   - Days: Click weekday buttons
   - Immediate: No configuration needed
5. **Save**: Click "Save Delivery Settings"
6. **Confirmation**: ✅ Success message appears

### Buyer Order Flow

1. **Add items** to cart
2. **Proceed to checkout**
3. **Fill details**: Name, Phone, Email, Address
4. **Select delivery** (if enabled by seller):
   - Choose from dropdown (time slots/days)
   - OR see immediate delivery confirmation
5. **Add special instructions** (optional)
6. **Choose payment method**
7. **Place order** → Delivery info included in WhatsApp message

## Technical Implementation

### Database Schema

```sql
stores {
  delivery_enabled: BOOLEAN DEFAULT false
  delivery_type: VARCHAR(50) DEFAULT 'none'
  delivery_slots: JSONB DEFAULT '[]'::jsonb
}
```

### Data Examples

**Time Slots:**

```json
{
  "delivery_enabled": true,
  "delivery_type": "time_slots",
  "delivery_slots": ["9AM-12PM", "12PM-3PM", "3PM-6PM", "Custom: 7PM-10PM"]
}
```

**Days:**

```json
{
  "delivery_enabled": true,
  "delivery_type": "days",
  "delivery_slots": ["Monday", "Wednesday", "Friday", "Saturday"]
}
```

**Immediate:**

```json
{
  "delivery_enabled": true,
  "delivery_type": "immediate",
  "delivery_slots": []
}
```

### API Endpoints

**POST `/api/store/update-delivery`**

- Updates delivery configuration
- Validates store ownership
- Saves to database

**Request Body:**

```json
{
  "storeId": "uuid",
  "deliveryEnabled": true,
  "deliveryType": "time_slots",
  "deliverySlots": ["9AM-12PM", "3PM-6PM"]
}
```

### Components Modified/Created

**New Components:**

- ✨ `components/DeliverySettings.tsx` - Seller configuration UI
- ✨ `app/api/store/update-delivery/route.ts` - Save API

**Modified Components:**

- 🔧 `components/StoreSettingsForm.tsx` - Added DeliverySettings
- 🔧 `components/UnifiedCheckout.tsx` - Added delivery slot selection
- 🔧 `types/interfaces.ts` - Added delivery fields to Store interface

### Order Notes Format

When buyer selects delivery slot, it's automatically included in order notes:

```
Delivery Time: 3PM-6PM

Customer's special instructions go here...
```

OR

```
Delivery Day: Friday

Please ring the doorbell twice
```

## Validation & Error Handling

### Seller Side

- Cannot save without selecting at least one slot (for time_slots/days modes)
- Custom slots validated for non-empty strings
- Duplicate slots prevented

### Buyer Side

- Delivery slot required if enabled (except immediate mode)
- Clear error messages: "Please select a delivery time slot"
- Validation before order placement

## WhatsApp Integration

Delivery information is included in WhatsApp message:

```
🛒 New Order from Watzy Store!

👤 Customer: John Doe
📱 Phone: +91 98765 43210
📍 Address: 123 Main St, Mumbai

🕐 Delivery Time: 3PM-6PM

📦 Items:
1x Product Name - ₹500

💰 Total: ₹500

Special Instructions: Please call before delivery
```

## UI/UX Features

### Seller Interface

- **Visual Card Design**: Clean white card with emoji headers
- **Three-Column Grid**: Side-by-side delivery type selection
- **Color Coding**: Blue highlights for selected options
- **Badge Display**: Selected slots shown as removable badges
- **Success Feedback**: Green success message on save
- **Mobile Responsive**: Stacks on small screens

### Buyer Interface

- **Contextual Display**: Only shows when seller enables it
- **Required Field Indicator**: Red asterisk (\*) when mandatory
- **Clear Labels**: "Preferred Delivery Time" vs "Preferred Delivery Day"
- **Dropdown Selection**: Easy-to-use select input
- **Immediate Mode Banner**: Green informational banner
- **Mobile Friendly**: Touch-optimized inputs

## Use Cases

### 1. Restaurant/Food Delivery

- **Type**: Time Slots
- **Slots**: "11AM-1PM (Lunch)", "6PM-8PM (Dinner)", "8PM-10PM (Late Night)"
- **Benefit**: Manage kitchen capacity

### 2. Grocery Delivery

- **Type**: Days
- **Slots**: "Monday", "Wednesday", "Friday"
- **Benefit**: Schedule delivery routes

### 3. Courier Service

- **Type**: Immediate
- **Slots**: None
- **Benefit**: On-demand delivery

### 4. Bakery/Catering

- **Type**: Time Slots
- **Slots**: "Morning (8AM-10AM)", "Afternoon (2PM-4PM)"
- **Benefit**: Fresh delivery windows

## Testing Checklist

### Seller Testing

- [ ] Enable delivery scheduling
- [ ] Select time slots mode and add slots
- [ ] Select days mode and add days
- [ ] Select immediate mode
- [ ] Save settings successfully
- [ ] Verify settings persist after page reload
- [ ] Add custom time slot
- [ ] Remove a slot
- [ ] Disable delivery scheduling

### Buyer Testing

- [ ] View checkout with time slots enabled
- [ ] Select a time slot from dropdown
- [ ] Try submitting without slot (should show error)
- [ ] Complete order with slot selected
- [ ] Verify delivery info in WhatsApp message
- [ ] Test with days mode
- [ ] Test with immediate mode (no dropdown shown)
- [ ] Test with delivery disabled (field hidden)

## Mobile Responsiveness

### Small Screens (< 768px)

- Delivery type cards stack vertically
- Slot buttons wrap in grid
- Dropdowns full-width
- Touch-friendly tap targets

### Large Screens (≥ 768px)

- Three-column delivery type selection
- Four-column slot grid
- Side-by-side layouts
- Spacious design

## Future Enhancements

Possible additions:

- [ ] Delivery fee per slot
- [ ] Slot capacity limits
- [ ] Calendar date picker
- [ ] Recurring delivery schedules
- [ ] Multiple delivery addresses
- [ ] Delivery tracking
- [ ] Slot availability in real-time
- [ ] Holiday/closed day management

## Troubleshooting

### Delivery settings not saving

1. Check browser console for errors
2. Verify user is authenticated
3. Confirm store ownership
4. Check database migration ran successfully

### Buyer not seeing delivery options

1. Verify seller enabled delivery scheduling
2. Check delivery_type is not 'none'
3. Ensure delivery_slots array has items (except immediate mode)
4. Clear browser cache

### Delivery info not in WhatsApp message

1. Check customerInfo.deliverySlot is populated
2. Verify getOrderNotes() function is called
3. Confirm delivery info format in WhatsApp message template

---

**Status**: ✅ Implemented and Build Successful  
**Database Migration**: ⚠️ Required (see SQL above)  
**Breaking Changes**: ❌ None (backward compatible)
