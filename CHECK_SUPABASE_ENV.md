# Check Supabase Environment Variable

There's a possibility that the `.env.local` file or Supabase SDK is reading a cached URL.

## Check for Hardcoded URLs

Run this command to search for any hardcoded localhost or 0.0.0.0 URLs:

```bash
grep -r "0.0.0.0" --include="*.env*" --include="*.ts" --include="*.tsx" --include="*.js" .
grep -r "localhost:5000" --include="*.env*" --include="*.ts" --include="*.tsx" --include="*.js" .
```

## Check .env.local

Make sure your `.env.local` doesn't have any old URLs cached.

## Clear Browser Cache

Sometimes the browser caches the old redirect. Try:
1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"

Or test in an Incognito/Private window.
