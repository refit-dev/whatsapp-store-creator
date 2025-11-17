# Code Optimization Tools - Quick Reference

## ✅ Installation Complete

**Tools Installed:**

- ✅ `@next/bundle-analyzer` - Bundle size visualization
- ✅ `depcheck` - Unused dependency detection

---

## 🚀 Quick Start Commands

### Analyze Bundle Size (Windows)

```bash
pnpm run analyze:windows
```

Opens interactive bundle visualization in browser at http://localhost:8888

### Analyze Bundle Size (macOS/Linux)

```bash
pnpm run analyze
```

### Check for Unused Dependencies

```bash
pnpm run check-deps
```

### Detailed Dependency Check

```bash
pnpm run check-deps:detailed
```

---

## 📊 Webpack Bundle Analyzer

### What You'll See

After running `pnpm run analyze:windows`:

1. **Build completes** (~2-5 minutes)
2. **Browser opens automatically** with interactive treemap
3. **Explore your bundle:**
   - Large boxes = Large packages
   - Hover for size details
   - Click to drill down

### Key Metrics to Watch

| Metric                    | Good     | Warning    | Critical |
| ------------------------- | -------- | ---------- | -------- |
| Total Client JS (gzipped) | < 200 KB | 200-300 KB | > 300 KB |
| First Load JS             | < 100 KB | 100-150 KB | > 150 KB |
| Largest Package           | < 50 KB  | 50-100 KB  | > 100 KB |

### What to Look For

1. **Large Packages** - Boxes bigger than others

   - Example: If `@supabase/supabase-js` is 150 KB, that's normal
   - Look for unexpected large packages

2. **Duplicates** - Same package appearing multiple times

   - Run `pnpm dedupe` to fix

3. **Unused Code** - Packages you don't recognize
   - Research what they're for
   - Remove if truly unused

---

## 🔍 Depcheck

### How to Read Output

**✅ Clean Result:**

```bash
No unused dependencies
No unused devDependencies
```

**⚠️ Needs Review:**

```bash
Unused dependencies
* some-package-you-forgot

Unused devDependencies
* old-testing-tool
```

### Important Notes

**DO NOT remove these (they're needed):**

- `@types/*` - TypeScript types
- `typescript` - Build tool
- `eslint` - Linting
- `tailwindcss` - CSS framework
- `autoprefixer` - PostCSS plugin
- `postcss` - CSS processing
- All packages listed in `.depcheckrc` ignoreMatches

**SAFE to remove:**

- Packages NOT in ignoreMatches
- Packages you know you're not using
- Old packages from previous features

### Before Removing

1. **Search for usage:**

   ```bash
   grep -r "from 'package-name'" .
   grep -r "require('package-name')" .
   ```

2. **Check imports in files**

3. **Remove if confirmed unused:**

   ```bash
   pnpm remove package-name
   ```

4. **Test app works:**
   ```bash
   pnpm dev
   # Test all major features
   ```

---

## 🎯 Optimization Workflow

### Monthly Bundle Check

```bash
# 1. Analyze current state
pnpm run analyze:windows

# 2. Note total size in docs/bundle-size-log.md

# 3. Identify opportunities:
#    - Packages > 50 KB
#    - Duplicate packages
#    - Unexpected packages

# 4. Take action (see below)
```

### Quarterly Dependency Cleanup

```bash
# 1. Check for unused deps
pnpm run check-deps

# 2. Review output carefully

# 3. Remove confirmed unused packages
pnpm remove unused-package

# 4. Test thoroughly
pnpm build
pnpm start

# 5. Update dependencies
pnpm update
```

---

## 🔧 Common Optimizations

### 1. Large Component → Dynamic Import

**Before:**

```typescript
import HeavyComponent from "./HeavyComponent";

export default function Page() {
  return <HeavyComponent />;
}
```

**After:**

```typescript
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <p>Loading...</p>,
});

export default function Page() {
  return <HeavyComponent />;
}
```

**Result:** Component only loaded when page is visited

### 2. Conditional Loading

**Before:**

```typescript
import Analytics from "./Analytics";

export default function App() {
  const showAnalytics = user?.isPremium;
  return showAnalytics && <Analytics />;
}
```

**After:**

```typescript
import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("./Analytics"));

export default function App() {
  const showAnalytics = user?.isPremium;
  return showAnalytics && <Analytics />;
}
```

**Result:** Analytics only loaded for premium users

### 3. Remove Unused Dependencies

```bash
# Check what's unused
pnpm run check-deps

# Remove confirmed unused
pnpm remove unused-package

# Verify build still works
pnpm build
```

---

## 📁 Files & Configuration

### Files Created

- `.depcheckrc` - Depcheck configuration
- `docs/code-optimization-tools.md` - Full documentation
- `docs/code-optimization-quick-reference.md` - This file

### Files Modified

- `next.config.js` - Added bundle analyzer
- `package.json` - Added convenience scripts

### Scripts Added to package.json

```json
{
  "analyze": "ANALYZE=true next build",
  "analyze:windows": "set ANALYZE=true && next build",
  "check-deps": "depcheck",
  "check-deps:detailed": "depcheck --detailed"
}
```

---

## ⚠️ Troubleshooting

### Bundle Analyzer Doesn't Open

**Try:**

1. Manually open: http://localhost:8888
2. Check terminal for errors
3. Restart dev server

### Depcheck Shows False Positives

**Solution:**

- Packages in `.depcheckrc` ignoreMatches are intentionally ignored
- These are needed for build/dev tools

### Build Takes Too Long

**Solutions:**

- This is normal for analysis (production build)
- Only run analyzer when needed (not every build)
- Close other resource-heavy applications

---

## 📈 Bundle Size Goals

### Current State (After Optimization)

Run to establish baseline:

```bash
pnpm run analyze:windows
```

### Target Metrics

| Bundle          | Target   | Current | Status   |
| --------------- | -------- | ------- | -------- |
| Total Client JS | < 300 KB | TBD     | 🔄 Check |
| First Load      | < 150 KB | TBD     | 🔄 Check |
| Dashboard       | < 100 KB | TBD     | 🔄 Check |

### Expected Large Packages

Your app will have these large dependencies (normal):

1. **@supabase/supabase-js** (~150 KB) - Database/Auth ✅
2. **next** (~100-120 KB) - Framework ✅
3. **react & react-dom** (~100 KB) - UI Library ✅
4. **Payment SDKs** (~50-80 KB) - Stripe/Razorpay ✅

**Total Expected:** ~400-450 KB (before optimization)
**After Optimization:** < 300 KB (goal)

---

## 🎓 Learning Resources

### Documentation

- Full Guide: `docs/code-optimization-tools.md`
- Next.js Docs: https://nextjs.org/docs/app/building-your-application/optimizing
- Bundle Analyzer: https://github.com/webpack-contrib/webpack-bundle-analyzer

### Tools

- Bundle Phobia: https://bundlephobia.com/ (check package sizes before installing)
- Package Phobia: https://packagephobia.com/ (install size)

---

## ✅ Setup Checklist

- [x] Installed `@next/bundle-analyzer`
- [x] Installed `depcheck`
- [x] Configured `next.config.js`
- [x] Created `.depcheckrc`
- [x] Added npm scripts
- [x] Created documentation
- [ ] Run first bundle analysis
- [ ] Check for unused dependencies
- [ ] Document baseline metrics

---

## 🚀 Next Steps

1. **Run First Analysis:**

   ```bash
   pnpm run analyze:windows
   ```

2. **Document Baseline:**

   - Note total bundle size
   - Identify 3 largest packages
   - Save to `docs/bundle-size-log.md`

3. **Check Dependencies:**

   ```bash
   pnpm run check-deps
   ```

4. **Plan Optimizations:**
   - List 3 optimization opportunities
   - Prioritize by impact

---

**Your optimization toolkit is ready! Start with `pnpm run analyze:windows` 🎯**
