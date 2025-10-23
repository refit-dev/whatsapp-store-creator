# 🚀 Database Setup Required

## Action Needed

The demo store data needs to be inserted into your Supabase database. Please follow these steps:

### 1. Open Supabase Dashboard
Go to your Supabase project dashboard

### 2. Navigate to SQL Editor
Click on "SQL Editor" in the left sidebar

### 3. Run the Setup Script
1. Open the file `SETUP_DATABASE.sql` in this project
2. Copy the **ENTIRE** contents (all 332 lines)
3. Paste it into the Supabase SQL Editor
4. Click "RUN" button

### 4. What This Creates

The script will create:
- ✅ All necessary database tables (if not already created)
- ✅ Row Level Security policies
- ✅ A demo store called "Demo Bakery" at `/demo-bakes`
- ✅ 6 sample products with real images (Sourdough, Croissants, Muffins, etc.)

### 5. After Running the Script

Once you've run the SQL script:
1. Refresh this page
2. Visit `/demo-bakes` to see the demo store
3. Try adding products to cart and checkout

---

## Important Notes

- The script uses `ON CONFLICT DO UPDATE` so it's safe to run multiple times
- It won't duplicate data if run again
- The demo store handle is: `demo-bakes`
- Demo products include real Unsplash images that will load beautifully

---

## Verification

After running the script, you should be able to:
1. Visit `https://your-app-url/demo-bakes` and see the Demo Bakery
2. See 6 products with images and prices
3. Add items to cart and proceed to checkout

Let me know once you've run the SQL script and I'll verify everything is working!