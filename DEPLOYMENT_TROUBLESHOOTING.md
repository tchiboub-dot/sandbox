# Deployment Workflow & Verification Guide

## CRITICAL: Understanding Your Deployment

Your project has **two separate deployments**:

### 1. **Frontend** (Vercel)
- React + TypeScript application
- Static files served from `/dist`
- Uses environment variables: `VITE_API_URL`
- Deployed automatically on git push

### 2. **Backend** (Separate Service)
- Express API server
- Must be deployed separately (Railway, Render, AWS, etc.)
- Frontend communicates via `VITE_API_URL`
- Without backend, frontend shows "Backend service unreachable"

---

## Why Changes Don't Appear on Vercel

### ❌ Common Issues

1. **Code committed but not pushed**
   ```bash
   git status
   # If "nothing to commit" → code is pushed ✓
   # If files listed → commit and push
   ```

2. **Environment variables not set on Vercel**
   - Vercel might not have `VITE_API_URL`
   - Frontend assumes `/api` (doesn't work if backend is external)
   - Device launches fail silently

3. **Vercel still building/deploying**
   - Check Vercel Dashboard → Deployments
   - Look for "Building...", "Initializing..." status
   - Blue badge = still deploying
   - Green checkmark = ready

4. **Browser cache **
   - Vercel serves old version from browser cache
   - Hard refresh: `Ctrl+Shift+Delete` then refresh
   - Or: Open in Incognito mode

5. **Vercel serving old git commit**
   - Check Vercel Deployment Details
   - Verify it's deploying latest git hash
   - Compare with `git log --oneline -1` locally

6. **Build errors hidden**
   - Check Vercel Build Logs in Dashboard
   - TypeScript compile errors stop deployment
   - Missing dependencies cause silent failures

---

## How to Verify Your Deployment

### Step 1: Check Git Status

```bash
cd /path/to/sandbox
git status
# Should show: "nothing to commit, working tree clean"

git log --oneline -1
# Should show: your latest commit hash
# Example: fb66e07 fix: SPA routing configuration for Vercel
```

### Step 2: Check GitHub Push

```bash
git remote -v
# Should show: https://github.com/tchiboub-dot/sandbox.git

# Check if latest commit is on GitHub
git log origin/main --oneline -1
# Should match your local git log
```

### Step 3: Check Vercel Deployment

**Via Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project: "Cloud Device Lab"
3. Look at "Recent Deployments"
4. Click latest deployment
5. In "Deployment Details":
   - Check "Status" (should be ✓ Ready)
   - Check "Git Commit" (should match your latest commit)
   - Check "Build Logs" for errors

**Expected in Build Logs:**
```
✓ Installed dependencies
✓ Build metadata injected:
  Version: 1.0.0
  Commit: fb66e07 (main)
✓ Compiled successfully
✓ 2379 modules transformed
```

### Step 4: Check Environment Variables on Vercel

**Settings → Environment Variables:**

Required for production:
```
VITE_API_URL=https://your-api-server.railway.app/api
```

If NOT set:
- Frontend will use fallback `/api`
- Device launches will fail
- Add this variable and redeploy

### Step 5: Test the Deployed App

#### Test 1: Homepage loads
```bash
curl https://your-app.vercel.app/
# Should return HTML (not 404)
```

#### Test 2: Specific routes work
```bash
# Direct access to /admin should load (not 404)
https://your-app.vercel.app/admin

# Refresh on /admin should work (not 404)
# Ctrl+Shift+R to hard refresh
```

#### Test 3: Console shows correct version
```
Open browser DevTools (F12)
Click Console tab
Look for "[CloudDeviceLab]" logs showing:
- Version
- Commit
- API URL
```

#### Test 4: Inspect page source for build metadata
```
View page source (Ctrl+U)
Scroll to end of HTML
Should show: <!-- Built: ... -->
```

---

## Troubleshooting: Changes Not Appearing

### Scenario 1: Code is committed but doesn't appear on Vercel

**Step 1.1: Verify git push**
```bash
git log --oneline -1                    # Get latest local commit
git log origin/main --oneline -1        # Get latest on GitHub
# These should match
```

**If they don't match:** Push to GitHub
```bash
git push origin main
```

**Step 1.2: Check Vercel knows about the new commit**

Go to Vercel Dashboard:
- Deployments → Latest
- Check "Git Commit" matches your `git log`
- If not, click "Redeploy"

### Scenario 2: Vercel is deploying old code

**Cause:** Vercel might have stale build cache

**Fix:** Force clean redeploy
```bash
# Option 1: Via Dashboard
Vercel Dashboard → Deployments → Latest
Click "..." menu → "Redeploy"

# Option 2: Make a dummy commit
echo "# Deployment fix" >> README.md
git add README.md
git commit -m "chore: trigger fresh deployment"
git push origin main

# Then check Vercel Dashboard - should start new build
```

### Scenario 3: Environment variables not set

**Check if backend is configured:**

On Vercel Dashboard:
- Settings → Environment Variables
- Look for `VITE_API_URL`

**If missing:**
```bash
# Add this environment variable:
VITE_API_URL=https://your-backend-url/api

# Then redeploy:
git commit --allow-empty -m "trigger deployment for env vars"
git push origin main
```

### Scenario 4: Routes like /admin return 404

**Verify vercel.json is correct:**

```bash
cat vercel.json
```

Should have:
```json
"rewrites": [
  {
    "source": "^/(?!api|assets|health|.*\\.(?:js|css|...))(.*)$",
    "destination": "/index.html"
  }
]
```

If missing or wrong:
1. Fix vercel.json
2. Commit and push
3. Check Vercel builds successfully

### Scenario 5: API calls fail with "Backend service unreachable"

**Cause:** Backend API URL not configured

**Symptoms:**
- Device launch button click → error appears
- Console shows: "Backend service unreachable"

**Fix:**
1. Deploy backend to Railway/Render/AWS
2. Get backend URL (e.g., `https://api.railway.app`)
3. On Vercel Dashboard → Settings → Environment Variables
4. Add: `VITE_API_URL=https://api.railway.app/api`
5. Redeploy

---

## How to Force Fresh Deployment

### Method 1: Vercel Dashboard (Fastest)
```
Vercel Dashboard → Deployments → Latest
Click "..." menu → "Redeploy"
Wait for "Ready" badge
```

### Method 2: Git Push (Automatic)
```bash
# Make sure your change is committed
git status  # Should say "nothing to commit"

# If not, commit first:
git add .
git commit -m "fix: description"

# Push to trigger Vercel build
git push origin main

# Watch Vercel Dashboard for new deployment
```

### Method 3: Force with Empty Commit
```bash
# Triggers Vercel even if no code changed
git commit --allow-empty -m "trigger: fresh deployment"
git push origin main
```

---

## Build Metadata for Debugging

### What Gets Injected During Build

When you run `npm run build`, this metadata is automatically injected:

```typescript
// Generated automatically
BUILD_METADATA = {
  version: "1.0.0",              // From package.json
  commitHash: "fb66e07",         // First 7 chars of git commit
  buildTime: "Mar 10, 2026...",  // Build timestamp
  environment: "production"       // Build environment
}
```

### Where to Find It in the App

**In Development Mode (localhost:3000):**
1. Scroll to footer
2. See "Debug Info" box showing:
   - Version
   - Commit hash
   - Build time
   - Environment

**On Vercel (production):**
1. Open DevTools (F12)
2. Console tab
3. Look for `[CloudDeviceLab]` logs
4. Should show version and commit

**To manually check:**
```bash
# View page source (Ctrl+U)
# Scroll to end
# Look for: <!-- Built: -->
```

---

## Environment Variables Checklist

### Frontend (Vercel)

These must be set in Vercel Dashboard → Settings → Environment Variables

```
VITE_API_URL=<your-backend-url>/api
```

Example values:
- Railway: `https://yourapp-production.up.railway.app/api`
- Render: `https://your-api-server.onrender.com/api`
- AWS: `https://api.yourdomain.com/api`

### Backend (Separate Deployment)

These must be set where you deploy your backend:

```
NODE_ENV=production
PORT=5000 (or as needed)
DATABASE_URL=postgres://...
REDIS_URL=redis://...
CORS_ORIGIN=https://your-vercel-app.vercel.app
CORS_ALLOW_VERCEL_PREVIEWS=true
```

---

## Complete Deployment Workflow

### First Time Setup

```bash
# 1. Deploy backend to Railway/Render/AWS
#    (Get your backend URL)

# 2. Add Vercel project
#    Vercel Dashboard → New Project → Import GitHub → tchiboub-dot/sandbox

# 3. Configure Vercel environment variables
#    Settings → Environment Variables
#    Add: VITE_API_URL=<your-backend-url>/api

# 4. Deploy
#    Vercel auto-deploys on git push
```

### Regular Updates

```bash
# 1. Make changes locally
vim frontend/src/pages/Dashboard.tsx

# 2. Test locally
cd frontend && npm run dev
# Visit http://localhost:3000/admin
# Verify changes work

# 3. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin main

# 4. Verify on Vercel
#    Check Vercel Dashboard for "Ready" badge
#    Visit https://your-app.vercel.app/admin
#    Hard refresh (Ctrl+Shift+R)
#    Should see changes
```

### Troubleshooting Updates Not Appearing

```bash
# 1. Verify code is committed and pushed
git status
git log origin/main --oneline -1

# 2. Check Vercel deployment status
#    Visit Vercel Dashboard
#    Look at Deployments section

# 3. If Vercel is still building:
#    Wait for "Ready" badge to appear

# 4. If Vercel shows old commit:
#    Vercel Dashboard → Deployments → Latest → "Redeploy"

# 5. If changes still don't appear:
#    Browser: Ctrl+Shift+Delete (clear cache)
#    Then: Ctrl+Shift+R (hard refresh)

# 6. If still stuck:
#    Force fresh deployment:
#    git commit --allow-empty -m "trigger: fresh deployment"
#    git push origin main
```

---

## Verifying Everything Works

### Checklist

- [ ] `git status` shows "nothing to commit, working tree clean"
- [ ] `git log --oneline -1` shows your latest change
- [ ] Vercel Dashboard shows your commit with ✓ "Ready" status
- [ ] `https://your-app.vercel.app/` loads (homepage works)
- [ ] `https://your-app.vercel.app/admin` works (direct access)
- [ ] Refresh on `/admin` works (doesn't show 404)
- [ ] Browser console has no errors
- [ ] Device launch button works (backend is configured)
- [ ] Footer shows correct version in dev mode
- [ ] Console logs include your latest commit hash

### If ANY of above fails:

```bash
# Force clean deployment
git commit --allow-empty -m "trigger: fresh deployment"
git push origin main

# Wait 1-2 minutes
# Then check Vercel Dashboard again
```

---

## Manual Verification Script

```bash
#!/bin/bash
echo "=== Deployment Verification ==="

echo "1. Git Status:"
git status

echo -e "\n2. Latest Commit:"
git log --oneline -1

echo -e "\n3. GitHub Status:"
git log origin/main --oneline -1

echo -e "\n4. Environment Files:"
ls -la frontend/.env* 2>/dev/null || echo "No .env files found (expected)"

echo -e "\n5. Build Output:"
ls -lh frontend/dist/ | head -5

echo -e "\n6. Vercel Config:"
grep -E "(buildCommand|outputDirectory|version)" vercel.json

echo -e "\n✓ Verification complete. Check Vercel Dashboard for deployment status."
```

---

## Quick Reference

| Issue | Fix |
|-------|-----|
| Changes don't appear | `git push origin main` → Check Vercel Dashboard |
| Routes return 404 | Verify vercel.json has correct rewrite rule |
| Device launch fails | Set `VITE_API_URL` on Vercel to your backend URL |
| Old version appears | Browser: `Ctrl+Shift+Delete` → hard refresh |
| Deployment stuck | Vercel Dashboard → Redeploy |
| API not responding | Backend service must be deployed separately |
| Build fails | Check Vercel Build Logs in Dashboard |
