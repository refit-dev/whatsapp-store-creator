# Git Branching Workflow Guide

## ✅ **Setup Complete!**

Your repository now has:

- **`main`** branch → Production (protected)
- **`dev`** branch → Development (active development)

## **Daily Development Workflow**

### **1. Starting New Feature Development**

```bash
# Switch to dev branch
git checkout dev

# Pull latest changes
git pull origin dev

# Create feature branch (optional but recommended)
git checkout -b feature/your-feature-name
```

### **2. During Development**

```bash
# Make your changes, then:
git add .
git commit -m "Add new feature: description"

# If using feature branch:
git push origin feature/your-feature-name

# If working directly on dev:
git push origin dev
```

### **3. Testing Phase**

```bash
# Switch to dev branch for integration testing
git checkout dev

# If you used a feature branch, merge it:
git merge feature/your-feature-name
git push origin dev

# Test everything thoroughly on dev branch
```

### **4. Production Deployment**

```bash
# When dev is stable and tested:
git checkout main
git pull origin main
git merge dev
git push origin main

# Or create Pull Request on GitHub (recommended)
```

## **Branch Protection (Next Steps)**

### **On GitHub Website:**

1. Go to **Settings** → **Branches**
2. Add rule for **`main`** branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict pushes that create files larger than 100MB

### **Vercel Deployment Setup:**

1. **Production**: Connect to `main` branch
2. **Preview**: Connect to `dev` branch for testing
3. **Feature Branches**: Auto-deploy for preview

## **Recommended Workflow Patterns**

### **For Solo Development:**

```
Local Changes → dev branch → Test → main branch → Production
```

### **For Team Development:**

```
Feature Branch → dev branch → Team Review → main branch → Production
```

### **Emergency Hotfixes:**

```
main branch → hotfix branch → Quick fix → main branch → Production
              ↓
            merge to dev
```

## **Common Commands Reference**

### **Check Current Status:**

```bash
git status                    # See current changes
git branch                    # See local branches
git branch -r                 # See remote branches
```

### **Branch Operations:**

```bash
git checkout dev             # Switch to dev
git checkout main            # Switch to main
git checkout -b new-feature  # Create and switch to new branch
git branch -d feature-name   # Delete local branch
```

### **Sync Operations:**

```bash
git pull origin main         # Get latest from main
git pull origin dev          # Get latest from dev
git push origin branch-name  # Push to remote
```

## **Safety Tips**

### **Always Before Major Changes:**

1. **Commit or stash** current work
2. **Pull latest changes** from remote
3. **Test locally** before pushing
4. **Use feature branches** for experimental work

### **Never Do This:**

- ❌ Push directly to main in production
- ❌ Force push (`git push -f`) to shared branches
- ❌ Merge untested code to main
- ❌ Commit sensitive data (API keys, passwords)

### **Recovery Commands (Just in Case):**

```bash
git log --oneline           # See commit history
git checkout HEAD~1         # Go back one commit
git reset --hard origin/main # Reset to match remote main (destructive!)
git stash                   # Save changes temporarily
git stash pop              # Restore stashed changes
```

## **Your Current Setup**

- **Current Branch**: `main` (production-ready)
- **Development Branch**: `dev` (for active development)
- **Remote**: Both branches pushed to GitHub
- **Next Step**: Switch to dev branch for any new development

## **Quick Start Command**

To start developing a new feature:

```bash
git checkout dev
git pull origin dev
# Make your changes...
git add .
git commit -m "Your change description"
git push origin dev
```

Happy coding! Your production code is now safely protected. 🚀
