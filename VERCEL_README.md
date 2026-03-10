# Vercel Deployment Guide - Cloud Device Lab

Complete guide to deploying the Cloud Device Lab frontend on Vercel with proper backend connectivity.

## Quick Summary

- **Vercel hosts**: Frontend React application only
- **Separate deployment**: Backend API server, PostgreSQL, Redis
- **Environment variable**: `VITE_API_URL` tells frontend where to find backend
- **Without backend**: App shows "Backend service unreachable" error

## Framework Detection

- **Framework**: Vite + React + TypeScript
- **Node Version**: 18+ (Vercel default)
- **Output Directory**: `frontend/dist`

## Step 1: Set Up Backend Service (Required)

Before deploying frontend to Vercel, you must deploy backend separately.

### Option A: Deploy to Railway (Recommended)

```bash
# Prerequisites
# - Railway account: https://railway.app
# - Backend code ready

# Step 1: Push to GitHub
cd /path/to/sandbox
git push origin main

# Step 2: Create Railway project
# Go to https://railway.app/dashboard
# Click "New Project" → "Deploy from GitHub repo"
# Select: tchiboub-dot/sandbox

# Step 3: Configure environment
# - Root directory: backend
# - Build command: npm install && npm run build
# - Start command: npm run dev

# Step 4: Add services
# - PostgreSQL (Railway managed)
# - Redis (Railway managed)
# - Connect to API Server

# Step 5: Get your API URL
# Railway → Project → Settings → Domain
# Your API URL will be: https://your-project-production.up.railway.app
```

### Option B: Deploy to Render

```bash
# Go to https://render.com
# New → Web Service
# Connect GitHub repo: tchiboub-dot/sandbox
# Configure:
#   - Root directory: backend
#   - Build: npm install && npm run build
#   - Start: npm run dev
# Add PostgreSQL and Redis services
# Get domain URL from Settings
```

### Option C: Deploy to AWS EC2

```bash
# Create EC2 instance
# SSH into instance
# Clone repo: git clone https://github.com/tchiboub-dot/sandbox.git
# Install Node.js 18+
# Set up PM2: npm install -g pm2
# pm2 start backend/api-server/src/index.ts
# Configure security groups to allow port 5000 (or your port)
# Get your EC2 public IP or domain
```

## Step 2: Get Backend API URL

After deploying backend, you'll have a URL like:
- Railway: `https://your-app-production.up.railway.app`
- Render: `https://your-api-server.onrender.com`
- AWS EC2: `https://api.yourdomain.com`

**Your VITE_API_URL will be**: `{backend-url}/api`

Examples:
- Railway: `https://your-app-production.up.railway.app/api`
- Render: `https://your-api-server.onrender.com/api`
- AWS: `https://api.yourdomain.com/api`

## Step 3: Deploy Frontend to Vercel

### Option 1: Manual Deployment

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import Git Repository**:
   - Select: `tchiboub-dot/sandbox`
   - Framework: Vite (auto-detected)
4. **Configure Build**:
  - Root Directory: `.`
  - Build Command: `npm --workspace frontend run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`
5. **Set Environment Variables**:
   - Click "Environment Variables"
   - Add:
     ```
     VITE_API_URL = https://your-backend-domain.com/api
     VITE_API_BASE_URL = https://your-backend-domain.com
     VITE_ENABLE_DEBUG = true (for troubleshooting)
     ```
6. **Deploy**: Click "Deploy"

### Option 2: Automatic Deployment

Push to GitHub and Vercel auto-deploys:

```bash
git add .
git commit -m "fix: API configuration for Vercel"
git push origin main
# Vercel automatically starts deployment
```

## Step 4: Configure Environment Variables

### In Vercel Dashboard:

1. **Project → Settings → Environment Variables**
2. **Add the following vars**:

| Variable | Value | Required | Example |
|----------|-------|----------|---------|
| `VITE_API_URL` | Backend /api path | Yes | `https://your-api.railway.app/api` |
| `VITE_API_BASE_URL` | Backend base URL | No | `https://your-api.railway.app` |
| `VITE_SIGNALING_URL` | WebRTC signaling server | No | `https://your-signal.railway.app` |
| `VITE_STUN_SERVER` | STUN server | No | `stun:stun.l.google.com:19302` |
| `VITE_ENABLE_DEBUG` | Debug logging | No | `true` or `false` |

3. **Save and Redeploy**

## Step 5: Redeploy After Adding Environment Variables

1. **Vercel → Project → Deployments**
2. **Last deployment → Click three dots → Redeploy**
3. **Or trigger with git push**:
   ```bash
   git commit --allow-empty -m "Redeploy with env vars"
   git push origin main
   ```

## Troubleshooting

### Error: "Backend service unreachable"

**Cause**: VITE_API_URL not configured or backend is down

**Fix**:
```
1. Check backend is deployed and running
2. Get correct backend URL
3. Add to Vercel environment variables
4. Redeploy frontend
5. Clear browser cache (Shift+F5)
6. Check browser console (F12) for actual error
```

### Error: "CORS blocked"

**Cause**: Backend not configured to accept Vercel domain

**Fix**:
```
1. Go to backend configuration
2. Add Vercel domain to CORS_ORIGIN:
   CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:3000
3. Redeploy backend
4. Redeploy frontend
```

### Error: "Invalid session identifier"

**Cause**: Backend session endpoint not working

**Fix**:
```
1. Test backend health: curl {VITE_API_URL}/../health
2. Should return: {"status":"ok","timestamp":"..."}
3. If fails, check backend logs
4. Ensure database is accessible
```

### Build fails with "Cannot find module"

**Cause**: Missing dependencies in frontend/package.json

**Fix**:
```
cd frontend
npm install
npm run build  # Test locally first
git push origin main  # Then deploy to Vercel
```

## Testing

### Local Testing

```bash
# Build locally
cd frontend
npm run build
npm run preview

# Visit http://localhost:4173
# Test device launch
```

### Testing on Vercel

1. **Visit deployed URL**: `https://your-app.vercel.app`
2. **Open Browser Console**: F12
3. **Expected logs** (if VITE_ENABLE_DEBUG=true):
   ```
   [API] Deployment Config: {...}
   [API] Creating session: {...}
   [API] Response OK: {...}
   ```
4. **Click "Launch Android Device"**
5. **Should see**: Loading animation → Session created
6. **If error**: Check console and network tab

### Testing API Connectivity

```bash
# Test health endpoint
curl https://your-api.railway.app/health

# Should return:
# {"status":"ok","timestamp":"2024-03-10T..."}

# Test session creation
curl -X POST https://your-api.railway.app/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "android",
    "version": "14.0",
    "screenResolution": "1080x2400",
    "ram": "4GB",
    "cpu": "4 cores",
    "language": "English",
    "sessionDuration": 60
  }'
```

## Environment Variables Reference

### Required for Device Launch
- `VITE_API_URL` or `VITE_API_BASE_URL` → Backend API location

### Optional but Recommended
- `VITE_SIGNALING_URL` → WebRTC signaling server
- `VITE_ENABLE_DEBUG` → Debug logging in console

### Optional
- `VITE_STUN_SERVER` → NAT traversal (default: Google's)
- `VITE_TURN_SERVER`, `VITE_TURN_USERNAME`, `VITE_TURN_PASSWORD` → Restrictive networks
- `VITE_MAX_SESSION_DURATION` → Max session length (seconds)
- `VITE_SESSION_WARNING_TIME` → Expiry warning (seconds)

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] `VITE_API_URL` configured in Vercel
- [ ] Frontend redeployed after env var changes
- [ ] Backend CORS configured for Vercel domain
- [ ] TLS/SSL certificates valid (HTTPS)
- [ ] Backend database is backed up
- [ ] Redis cache is configured
- [ ] Rate limiting enabled on backend
- [ ] Logging configured for production
- [ ] Monitoring setup (errors, performance)

## CI/CD Automation

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Support

- **Issues**: Check GitHub issues
- **Docs**: See README.md and DEPLOYMENT.md
- **Backend Setup**: See backend/README.md
- **API Reference**: See backend/api-server/README.md

## Key Files

- `frontend/.env.example` → Environment variable template
- `vercel.json` → Vercel configuration
- `frontend/vite.config.ts` → Vite build config
- `frontend/src/config/api.ts` → API endpoint configuration
- `frontend/src/services/api.ts` → API client

## Summary

1. Deploy backend ✓
2. Get backend URL ✓
3. Deploy frontend to Vercel ✓
4. Add `VITE_API_URL` env var ✓
5. Redeploy frontend ✓
6. Test device launch ✓

Done!
- Ensure variables start with `VITE_` prefix
- Redeploy after changing variables
- Check variables are set for correct environment (Production/Preview)

### API Connection Fails
- Verify CORS is enabled on backend
- Check API URL is correct
- Ensure backend is deployed and running
- Check network tab for CORS errors

## Performance Optimization

Vercel automatically provides:
- ✅ Global CDN
- ✅ HTTP/2
- ✅ Brotli compression
- ✅ Image optimization (if used)
- ✅ Edge caching
- ✅ Automatic HTTPS

## Monitoring

Enable Vercel Analytics:
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. View real-time performance metrics

## Additional Resources

- [Vercel Vite Documentation](https://vercel.com/docs/frameworks/vite)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Build Configuration](https://vercel.com/docs/build-step)

---

Last Updated: March 9, 2026
