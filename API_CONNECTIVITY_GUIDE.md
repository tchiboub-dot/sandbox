# API Connectivity Guide - Cloud Device Lab

Comprehensive guide to fixing "Backend service unreachable" and similar API errors.

## Problem: Device Launch Fails with "Backend service unreachable"

When you click "Launch Android Device" or "Launch Windows Machine", the app shows:
```
Backend service unavailable. Please check configuration or try again later.
```

## Root Causes & Solutions

### Root Cause #1: VITE_API_URL Not Configured

**Symptom**: Error appears immediately or after 20 second timeout

**Why**: Frontend doesn't know where backend is located

#### Solution for Local Development:

1. **Start backend server**:
   ```bash
   cd backend/api-server
   npm install
   npm run dev
   # Should print: ✓ API Server running on port 5000
   ```

2. **Set environment variable** in `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Restart frontend**:
   ```bash
   cd frontend
   npm run dev
   # Visit http://localhost:3000
   ```

#### Solution for Vercel Production:

1. **Deploy backend** to Railway/Render/AWS (see VERCEL_README.md Step 1)

2. **Get backend URL** (e.g., `https://your-api.railway.app`)

3. **Add to Vercel environment variables**:
   - Go to Vercel Dashboard
   - Project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-api.railway.app/api`

4. **Redeploy frontend**:
   - Vercel will auto-detect env change
   - Or manually trigger redeploy

### Root Cause #2: Backend Server Not Running

**Symptom**: Works locally but fails on Vercel (or after stopping backend)

**Why**: Backend is down or crashed

#### Solution:

```bash
# Check if backend is running
curl http://localhost:5000/health
# Should return: {"status":"ok",...}

# If nothing, start it:
cd backend/api-server
npm run dev

# Check logs for errors:
tail -f backend/api-server/logs/*

# On production (Railway/Render):
# - Check service logs in dashboard
# - Restart service if needed
```

### Root Cause #3: CORS Configuration Mismatch

**Symptom**: Works locally, fails on Vercel with CORS error in console

**Why**: Backend doesn't allow requests from Vercel domain

#### Solution:

1. **Identify your Vercel domain**:
   - Vercel Dashboard → Deployments
   - Your URL looks like: `https://your-project.vercel.app`

2. **Update backend CORS** in `backend/api-server/.env`:
   ```
   CORS_ORIGIN=https://your-project.vercel.app,http://localhost:3000
   CORS_ALLOW_VERCEL_PREVIEWS=true
   ```

3. **Restart backend server**:
   ```bash
   # If local:
   npm run dev

   # If Railway/Render: redeploy service
   ```

### Root Cause #4: API URL Format Invalid

**Symptom**: Lots of "Invalid API response" errors

**Why**: Frontend sent request to wrong path

#### Solution:

Ensure `VITE_API_URL` includes `/api` at the end:

```
✅ CORRECT:   https://your-api.railway.app/api
❌ WRONG:     https://your-api.railway.app
❌ WRONG:     https://your-api.railway.app/api/api
```

The frontend automatically adds routes to this base, so:
- `{VITE_API_URL}/sessions` → `https://your-api.railway.app/api/sessions`
- `{VITE_API_URL}/admin/stats` → `https://your-api.railway.app/api/admin/stats`

### Root Cause #5: Database Connection Failed

**Symptom**: Backend starts but device launch returns error

**Why**: Backend can't access PostgreSQL

#### Solution:

```bash
# Check backend logs for database errors
cd backend/api-server
npm run dev
# Look for: "Database unavailable" or "connection refused"

# Verify database is running:
# - Local: docker-compose up -d postgres
# - Railway/Render: check managed service status
# - AWS: check RDS security groups

# Test database connection:
psql postgresql://user:pass@host:5432/sandbox_db
# Should connect successfully
```

### Root Cause #6: Redis Cache Not Available

**Symptom**: Backend starts, rate limiting returns errors

**Why**: Backend can't access Redis

#### Solution:

```bash
# Check backend logs for Redis errors
cd backend/api-server
npm run dev
# Look for: "Redis unavailable"

# Start Redis locally:
docker-compose up -d redis

# Or on production:
# - Railway/Render: add Redis service
# - AWS: use ElastiCache
```

## Debugging Steps

### Step 1: Check Frontend Configuration

```bash
cd frontend

# Look at actual config being used:
grep -r "API_BASE_URL\|VITE_API" src/config/

# Check environment variables loaded:
cat .env | grep VITE_API
```

### Step 2: Enable Debug Logging

In `frontend/.env`:
```
VITE_ENABLE_DEBUG=true
```

Then check browser console (F12) when launching device:
```
[API] Deployment Config: {
  environment: "development",
  apiBaseUrl: "/api",
  customBackend: false,
  hasViteApiUrl: false,
  hasViteApiBaseUrl: false
}

[API] Creating session: {
  method: "POST",
  url: "http://localhost:5000/api/sessions",
  data: { type: "android" }
}

[API] Response Error: {
  status: 0,
  message: "Network Error",
  code: "ERR_NETWORK"
}
```

### Step 3: Test Backend Health Directly

```bash
# Test backend health endpoint
curl -v http://localhost:5000/health
# Should return 200 OK with JSON

# Test session creation
curl -X POST http://localhost:5000/api/sessions \
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
# Should return: {"sessionId":"..."}
```

### Step 4: Check Network Tab in Browser DevTools

1. Open F12 → Network tab
2. Click "Launch Android Device"
3. Look for request to `/api/sessions` or `/api/health`
4. Check response status and body:
   - **200**: Success, but response format wrong
   - **404**: Endpoint doesn't exist
   - **500**: Backend error
   - **0**: Network error (backend down)

### Step 5: Check Backend Logs

```bash
# Local development
cd backend/api-server
npm run dev
# Logs appear in terminal

# Production on Railway/Render:
# - Dashboard → Logs tab
# - Look for errors like "Cannot connect", "ECONNREFUSED"
```

## Quick Diagnostic

Run this script to identify the problem:

```bash
#!/bin/bash
echo "=== Cloud Device Lab API Connectivity Check ==="

echo ""
echo "1. Checking frontend config..."
if [ -f "frontend/.env" ]; then
  VITE_API=$(grep VITE_API frontend/.env | head -1)
  echo "   Found: $VITE_API"
else
  echo "   ⚠️  No frontend/.env file"
  echo "   Create from: cp frontend/.env.example frontend/.env"
fi

echo ""
echo "2. Checking backend health..."
API_URL="${VITE_API_URL:-http://localhost:5000/api}"
HEALTH_URL="${API_URL%/api}/health"
echo "   Testing: $HEALTH_URL"
if curl -f -s "$HEALTH_URL" > /dev/null; then
  echo "   ✅ Backend is responding"
  curl -s "$HEALTH_URL" | jq '.' || echo "   (Response received but not JSON)"
else
  echo "   ❌ Backend is NOT responding"
  echo "   Make sure: npm run dev in backend/api-server"
fi

echo ""
echo "3. Checking session creation..."
SESSION_ENDPOINT="${API_URL}/sessions"
echo "   Testing: POST $SESSION_ENDPOINT"
curl -X POST "$SESSION_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{"type":"android","version":"14.0","screenResolution":"1080x2400","ram":"4GB","cpu":"4 cores","language":"English","sessionDuration":60}' \
  2>/dev/null | jq '.' || echo "   ❌ Request failed"

echo ""
echo "=== Done ==="
```

## Verification Checklist

- [ ] Backend server is running: `curl http://localhost:5000/health` returns 200
- [ ] `VITE_API_URL` is set in `frontend/.env` (local) or Vercel (production)
- [ ] `VITE_API_URL` ends with `/api`: e.g. `http://localhost:5000/api`
- [ ] Frontend is restarted after changing env var
- [ ] No CORS errors in browser console
- [ ] PostgreSQL is accessible (check `docker ps`)
- [ ] Redis is accessible (check `docker ps`)
- [ ] Network connectivity between frontend and backend
- [ ] Firewall isn't blocking port 5000 (local) or your backend domain (production)

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Backend service unreachable" | API not configured | Set `VITE_API_URL` |
| "Cannot reach backend API" | Backend down | Start backend with `npm run dev` |
| "CORS blocked" | Domain not allowed | Add domain to backend `CORS_ORIGIN` |
| "Invalid session identifier" | Wrong response format | Check backend database connection |
| "Timeout" | Backend too slow/down | Check backend logs, restart if needed |
| "Network Error" | Connection refused | Verify API URL, check firewall |

## Next Steps

1. **Verify backend is running**:
   ```bash
   cd backend/api-server && npm run dev
   ```

2. **Set frontend API URL**:
   ```bash
   cd frontend && echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

3. **Start frontend**:
   ```bash
   cd frontend && npm run dev
   ```

4. **Test device launch**:
   - Open http://localhost:3000
   - Click "Launch Android Device"
   - Should see loading animation
   - Should navigate to session page

5. **For Vercel production**:
   - Follow VERCEL_README.md steps 1-5
   - Redeploy after adding env vars
   - Test again

## Support

- Check backend logs for detailed errors
- Enable VITE_ENABLE_DEBUG=true for frontend logs
- See VERCEL_README.md for production setup
- See DEPLOYMENT.md for infrastructure setup
