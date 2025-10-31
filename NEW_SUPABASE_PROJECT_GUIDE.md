# NEW SUPABASE PROJECT SETUP GUIDE

## Step 1: Create New Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose a new name: `whatsapp-store-v2`
4. Select same organization
5. Choose same region as your current project
6. Set a strong database password (save it!)

## Step 2: Get New Credentials
After project creation:
1. Go to Settings → API
2. Copy the new:
   - Project URL
   - anon/public key
   - service_role key

## Step 3: Update Environment Variables
Replace in your .env.local:

```env
# NEW PROJECT CREDENTIALS
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

## Step 4: Set Up Basic Database Schema
Run this SQL in the new project's SQL Editor:

```sql
-- Basic stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  handle VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_e164 VARCHAR(20),
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Simple policy
CREATE POLICY "Enable all for authenticated users" ON stores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON stores TO authenticated;
```

## Step 5: Configure Auth Settings (IMPORTANT)
In the new project:
1. Go to Authentication → Settings
2. Set Site URL to: `http://localhost:3000`
3. **DISABLE email confirmations**
4. **DISABLE phone confirmations**
5. Save changes

## Step 6: Test Basic Signup
Try signing up with just email/password first to confirm auth works.

## Step 7: Migrate Data (If Needed)
Once basic auth works, we can migrate your existing store data to the new project.

This fresh start should eliminate any hidden configuration issues!