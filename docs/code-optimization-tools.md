# Code Optimization Tools Guide

Complete guide for using Webpack Bundle Analyzer and Depcheck to optimize your application's bundle size and dependencies.

**Implementation Date:** November 17, 2025  
**Status:** ✅ Configured and Ready to Use

---

## Table of Contents

1. [Overview](#overview)
2. [Webpack Bundle Analyzer](#webpack-bundle-analyzer)
3. [Depcheck](#depcheck)
4. [Quick Start](#quick-start)
5. [Optimization Workflow](#optimization-workflow)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Best Practices](#best-practices)

---

## Overview

### Tools Installed

1. **@next/bundle-analyzer** - Visualizes JavaScript bundle sizes
2. **depcheck** - Finds unused dependencies

### Benefits

- 🎯 **Identify Large Packages** - See what's bloating your bundle
- 🗑️ **Remove Unused Dependencies** - Clean up package.json
- 🚀 **Improve Performance** - Smaller bundles = faster load times
- 💰 **Reduce Costs** - Less bandwidth usage

---

## Webpack Bundle Analyzer

### What It Does

Webpack Bundle Analyzer creates an interactive treemap visualization of your JavaScript bundles, showing:

- Which packages are the largest
- What's included in each chunk
- Duplicate dependencies
- Unused code opportunities

### Usage

#### Windows (Recommended)

```bash
pnpm run analyze:windows
```

#### macOS/Linux

```bash
pnpm run analyze
```

### What Happens

1. **Build Process**: Builds your Next.js app with analysis enabled
2. **Opens Browser**: Automatically opens visualization in your browser
3. **Interactive Report**:
   - Hover over boxes to see package sizes
   - Click to drill down into packages
   - View stats (parsed, gzipped, stat sizes)

### Understanding the Visualization

The report shows 3 views:

1. **Client Bundle** - JavaScript sent to browsers

   - Look for: Large packages, duplicates
   - Goal: Keep under 200-300 KB gzipped

2. **Server Bundle** - Server-side code

   - Less critical for performance
   - Still good to optimize

3. **Shared Chunks** - Code used by multiple pages
   - Good for caching
   - Should contain common libraries

### Reading the Colors

- **Large Boxes** = Large packages (potential optimization targets)
- **Many Small Boxes** = Well-chunked code (good!)
- **Nested Boxes** = Dependencies within packages

### Example Output

```
Client Bundle (main)
├─ node_modules (800 KB)
│  ├─ @supabase/supabase-js (150 KB) ← Largest package
│  ├─ next (120 KB)
│  ├─ react-dom (100 KB)
│  └─ ...
└─ app (200 KB)
   ├─ dashboard (80 KB)
   ├─ api (60 KB)
   └─ components (60 KB)
```

---

## Depcheck

### What It Does

Depcheck analyzes your project to find:

- **Unused Dependencies** - Packages in package.json but not imported anywhere
- **Missing Dependencies** - Imports without corresponding package.json entries
- **Dev vs Production Mismatches** - Packages in wrong section

### Usage

#### Basic Check

```bash
pnpm run check-deps
```

**Output Example:**

```
Unused dependencies
* clsx (consider removing)
* some-unused-package

Unused devDependencies
* some-dev-package

Missing dependencies
* lodash (add to package.json)
```

#### Detailed Check

```bash
pnpm run check-deps:detailed
```

**Shows:**

- Where each dependency is used
- Full file paths
- Dependency tree

### Configuration

Configuration is in `.depcheckrc`:

```json
{
  "ignoreMatches": [
    "@types/*", // TypeScript type definitions
    "typescript", // Build tool
    "eslint", // Linter
    "tailwindcss", // Used in config files
    "@next/bundle-analyzer", // This tool
    "depcheck" // This tool
  ]
}
```

### What to Ignore

Some packages are **correctly listed** even if depcheck flags them:

✅ **Keep These:**

- `@types/*` - TypeScript type definitions
- `typescript` - Build tool
- `eslint` - Code linting
- `eslint-config-next` - Next.js ESLint config
- `autoprefixer` - PostCSS plugin (used by Tailwind)
- `postcss` - CSS processing
- `tailwindcss` - CSS framework
- `cypress` - E2E testing
- `tsx` - Test runner
- `@next/bundle-analyzer` - This tool
- `depcheck` - This tool

❌ **Safe to Remove:**

- Packages that appear in "Unused dependencies" (not ignoreMatches)
- Packages you know you're not using

---

## Quick Start

### Step 1: Analyze Bundle Size

Run the analyzer:

```bash
pnpm run analyze:windows
```

Wait for build to complete and browser to open.

### Step 2: Identify Large Packages

Look for:

1. **Largest Boxes** - Biggest packages
2. **Duplicates** - Same package multiple times
3. **Unexpected Packages** - Packages you don't recognize

### Step 3: Check for Unused Dependencies

Run depcheck:

```bash
pnpm run check-deps
```

Review the output carefully.

### Step 4: Take Action

See [Optimization Workflow](#optimization-workflow) below.

---

## Optimization Workflow

### 1. Large Package Found

**Example:** `@supabase/supabase-js` is 150 KB

**Actions:**

- ✅ **Keep** if actively used (authentication, database)
- ⚠️ **Lazy Load** if only used on certain pages
- 🔍 **Alternative** - Look for lighter alternatives
- 📦 **Tree Shaking** - Ensure you're importing only what you need

**Good Import:**

```typescript
import { createClient } from "@supabase/supabase-js";
```

**Bad Import (imports everything):**

```typescript
import * as Supabase from "@supabase/supabase-js";
```

### 2. Duplicate Dependency Found

**Example:** Two versions of `react` in bundle

**Actions:**

1. Check `pnpm-lock.yaml` for version conflicts
2. Run `pnpm dedupe` to deduplicate
3. Update conflicting packages to use same version

```bash
pnpm dedupe
```

### 3. Unused Dependency Found

**Example:** Depcheck reports `clsx` is unused

**Actions:**

1. **Verify**: Search codebase for imports

   ```bash
   grep -r "from 'clsx'" .
   grep -r "require('clsx')" .
   ```

2. **If truly unused**, remove:

   ```bash
   pnpm remove clsx
   ```

3. **Test**: Ensure app still works
   ```bash
   pnpm dev
   # Visit key pages, test functionality
   ```

### 4. Large Component Bundle

**Example:** Dashboard page is 200 KB

**Actions:**

- **Code Splitting**: Use dynamic imports

  ```typescript
  import dynamic from "next/dynamic";

  const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
    loading: () => <p>Loading...</p>,
  });
  ```

- **Lazy Load**: Load on interaction

  ```typescript
  const [showModal, setShowModal] = useState(false);

  const Modal = dynamic(() => import("./Modal"));

  {
    showModal && <Modal />;
  }
  ```

---

## Common Issues & Solutions

### Issue 1: Bundle Analyzer Won't Open

**Symptoms:**

- Build completes but browser doesn't open
- See error: "Cannot GET /"

**Solutions:**

1. Manually open: http://localhost:8888
2. Check if port 8888 is in use
3. Try different port:
   ```javascript
   // next.config.js
   const withBundleAnalyzer = require("@next/bundle-analyzer")({
     enabled: process.env.ANALYZE === "true",
     analyzerPort: 8889, // Different port
   });
   ```

### Issue 2: Depcheck False Positives

**Symptoms:**

- Depcheck reports packages as unused that you know are used
- TypeScript types flagged as unused

**Solutions:**

1. Check `.depcheckrc` ignoreMatches
2. Add false positives to ignoreMatches:
   ```json
   {
     "ignoreMatches": ["your-package-name"]
   }
   ```

### Issue 3: Build Takes Too Long

**Symptoms:**

- `pnpm run analyze` takes 5+ minutes

**Solutions:**

1. **Disable analyzer** when not needed (it's already disabled by default)
2. **Production build** is always slower (optimization)
3. **Close other apps** to free up resources

### Issue 4: Missing Dependencies Error

**Symptoms:**

- Depcheck reports missing dependencies
- App works fine

**Possible Causes:**

1. **Transitive Dependencies** - Installed by other packages
2. **Next.js Built-ins** - Provided by framework
3. **Node.js Built-ins** - Like `fs`, `path`

**Action:** Usually safe to ignore if app works

---

## Best Practices

### Bundle Size Goals

| Type                | Target   | Warning  | Critical |
| ------------------- | -------- | -------- | -------- |
| Client JS (gzipped) | < 200 KB | > 300 KB | > 500 KB |
| First Load JS       | < 100 KB | > 150 KB | > 200 KB |
| Individual Page     | < 50 KB  | > 100 KB | > 150 KB |

### Optimization Checklist

- [ ] **Analyze monthly** - Run bundle analyzer once a month
- [ ] **Check deps quarterly** - Run depcheck every 3 months
- [ ] **Review large packages** - Understand why they're needed
- [ ] **Dynamic imports** - Use for large components
- [ ] **Tree shaking** - Import only what you need
- [ ] **Image optimization** - Use Next.js Image component
- [ ] **Font optimization** - Use next/font
- [ ] **Remove unused code** - Regular code cleanup

### Import Best Practices

✅ **Good:**

```typescript
// Named imports (tree-shakeable)
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Dynamic import for large components
const Chart = dynamic(() => import("./Chart"));
```

❌ **Bad:**

```typescript
// Default import of entire library
import * as React from "react";
import * as Supabase from "@supabase/supabase-js";

// Synchronous import of large component
import Chart from "./Chart"; // If Chart is 50 KB
```

### Dependency Management

1. **Regular Cleanup:**

   ```bash
   # Every 3 months
   pnpm run check-deps
   # Review and remove unused
   ```

2. **Update Dependencies:**

   ```bash
   # Check for updates
   pnpm outdated

   # Update with care
   pnpm update
   ```

3. **Audit Security:**
   ```bash
   pnpm audit
   pnpm audit --fix
   ```

---

## Current Bundle Analysis

### Initial State (Before Optimization)

Run analysis to establish baseline:

```bash
pnpm run analyze:windows
```

### Expected Major Dependencies

Based on package.json, these are your largest dependencies:

1. **@supabase/supabase-js** (~150 KB)

   - **Purpose:** Database, authentication, storage
   - **Status:** ✅ Required (core functionality)
   - **Optimization:** Already optimized

2. **next** (~100-120 KB)

   - **Purpose:** Framework
   - **Status:** ✅ Required
   - **Optimization:** Automatic code splitting

3. **react & react-dom** (~100 KB combined)

   - **Purpose:** UI library
   - **Status:** ✅ Required
   - **Optimization:** Production build removes dev code

4. **stripe** & **razorpay** (~50-80 KB)

   - **Purpose:** Payment processing
   - **Status:** ⚠️ Check if both are needed
   - **Optimization:** Consider lazy loading

5. **twilio** (~50 KB)
   - **Purpose:** WhatsApp messaging
   - **Status:** ✅ Required
   - **Optimization:** Server-side only (not in client bundle)

### Optimization Opportunities

After running analysis, look for:

1. **Unused Lodash imports** - Switch to native JS
2. **Moment.js** - Switch to date-fns (if present)
3. **Large icons libraries** - Use selective imports
4. **Duplicate React instances** - Check pnpm-lock.yaml

---

## Scripts Reference

### Bundle Analyzer Scripts

```json
{
  "analyze": "ANALYZE=true next build",
  "analyze:windows": "set ANALYZE=true && next build"
}
```

**Usage:**

- Windows: `pnpm run analyze:windows`
- macOS/Linux: `pnpm run analyze`

### Depcheck Scripts

```json
{
  "check-deps": "depcheck",
  "check-deps:detailed": "depcheck --detailed"
}
```

**Usage:**

- Basic: `pnpm run check-deps`
- Detailed: `pnpm run check-deps:detailed`

---

## Example: Complete Optimization Session

### 1. Initial Analysis

```bash
# Analyze bundle
pnpm run analyze:windows

# Check dependencies
pnpm run check-deps
```

### 2. Review Results

**Bundle Analyzer shows:**

- Total bundle: 500 KB (too large!)
- @supabase/supabase-js: 150 KB
- Large dashboard component: 120 KB
- Stripe SDK: 80 KB

**Depcheck shows:**

- Unused: `clsx` (8 KB)
- Unused: `some-old-package` (50 KB)

### 3. Take Actions

```bash
# Remove unused dependencies
pnpm remove clsx some-old-package

# File: components/Dashboard.tsx
# Change to dynamic import
const DashboardChart = dynamic(() => import('./DashboardChart'));

# File: components/CheckoutForm.tsx
# Lazy load Stripe
const StripeForm = dynamic(() => import('./StripeForm'));
```

### 4. Re-analyze

```bash
# Build and check new size
pnpm run analyze:windows
```

**New Results:**

- Total bundle: 350 KB (↓ 150 KB / 30% reduction!)
- Dashboard: 50 KB (↓ 70 KB)
- Stripe: Lazy loaded

### 5. Test

```bash
# Verify app still works
pnpm dev

# Test all pages
# Check dashboard
# Test checkout flow
```

---

## Monitoring & Maintenance

### Monthly Tasks

```bash
# 1. Analyze bundle size
pnpm run analyze:windows

# 2. Check for regressions
# Compare with last month's report

# 3. Document changes
# Note: "Added X package (50 KB) for Y feature"
```

### Quarterly Tasks

```bash
# 1. Check dependencies
pnpm run check-deps:detailed

# 2. Review package.json
# Remove unused packages

# 3. Update dependencies
pnpm update

# 4. Audit security
pnpm audit
```

### Tracking Bundle Size

Create a log file: `bundle-size-log.md`

```markdown
# Bundle Size Log

## November 2025

- **Total:** 350 KB (gzipped)
- **Client:** 280 KB
- **Server:** 70 KB
- **Notes:** Initial optimization, removed 150 KB

## December 2025

- **Total:** 340 KB (↓ 10 KB)
- **Notes:** Lazy loaded payment forms
```

---

## Additional Resources

### Next.js Documentation

- [Optimizing Bundle Size](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
- [Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [Code Splitting](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

### Tools

- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Depcheck](https://www.npmjs.com/package/depcheck)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes before installing

### Performance

- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## Summary

✅ **Installed:**

- `@next/bundle-analyzer` - Bundle visualization
- `depcheck` - Unused dependency detection

✅ **Configured:**

- `next.config.js` - Bundle analyzer integration
- `.depcheckrc` - Depcheck configuration
- `package.json` - Convenient scripts

✅ **Scripts Available:**

- `pnpm run analyze:windows` - Analyze bundle (Windows)
- `pnpm run analyze` - Analyze bundle (macOS/Linux)
- `pnpm run check-deps` - Check for unused deps
- `pnpm run check-deps:detailed` - Detailed dep analysis

🎯 **Goals:**

- Keep client bundle < 300 KB (gzipped)
- Remove unused dependencies quarterly
- Monitor bundle size monthly
- Optimize large components with dynamic imports

**Your optimization toolkit is ready! 🚀**
