# 🚀 GitHub & Vercel Deployment Commands

This file contains the exact commands to push to GitHub and deploy to Vercel.

---

## ✅ Step 1: Push to GitHub (READY TO EXECUTE)

The repository has been initialized and is ready to push. Run these commands:

### Push to GitHub

```powershell
# Navigate to project directory (if not already there)
cd c:\Users\mlap\OneDrive\Desktop\appli-complete\sandbox-android-wind

# Push to GitHub main branch
git push -u origin main
```

**Note**: You may be prompted for GitHub authentication. Use a Personal Access Token or configure GitHub CLI.

### If Push Fails with Authentication

```powershell
# Option 1: Use GitHub CLI
gh auth login

# Option 2: Use Personal Access Token
# When prompted for password, enter your GitHub Personal Access Token
# Generate token at: https://github.com/settings/tokens

# Option 3: Configure SSH
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add key to GitHub: https://github.com/settings/keys
git remote set-url origin git@github.com:tchiboub-dot/sandbox.git
git push -u origin main
```

---

## ✅ Step 2: Deploy to Vercel

### Option A: Deploy with Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/new

2. **Import Git Repository**:
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Connect GitHub account if not connected
   - Select repository: `tchiboub-dot/sandbox`

3. **Configure Project**:
   ```
   Framework Preset: Vite
   Root Directory: .
   Build Command: npm --workspace frontend run build
   Output Directory: frontend/dist
   Install Command: npm install
   ```

4. **Add Environment Variables**:
   Click "Environment Variables" and add:
   ```
   VITE_API_BASE_URL = https://your-backend-api-url.com
   VITE_SIGNALING_URL = https://your-signaling-url.com
   VITE_STUN_SERVER = stun:stun.l.google.com:19302
   VITE_ENABLE_DEBUG = false
   VITE_ENABLE_ANALYTICS = false
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (3-5 minutes)
   - Your site will be live at: `https://your-project.vercel.app`

---

### Option B: Deploy with Vercel CLI

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview (test deployment)
vercel

# Deploy to production
vercel --prod
```

**During deployment, answer prompts**:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N` (first time) or `Y` (subsequent)
- Project name: `sandbox` or `cloud-device-lab`
- Directory: `./` (press Enter)
- Override settings: `Y`
   - Build Command: `npm --workspace frontend run build`
  - Output Directory: `frontend/dist`
   - Development Command: `npm --workspace frontend run dev`

---

## ✅ Step 3: Verify Deployment

### Check Build Logs

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project
3. Click on latest deployment
4. Check build logs for errors

### Common Build Errors & Fixes

#### Error: "Build Command failed"
**Solution**: Ensure build command is:
```bash
npm --workspace frontend run build
```

#### Error: "ENOENT: no such file or directory"
**Solution**: Set correct output directory:
```bash
frontend/dist
```

#### Error: "Environment variable not found"
**Solution**: Add all required environment variables in Vercel Dashboard

#### Error: "Module not found"
**Solution**: Ensure all dependencies are in `frontend/package.json`

---

## ✅ Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `yourdomain.com`
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (5-60 minutes)

---

## ✅ Step 5: Deploy Backend Services

⚠️ **Important**: Vercel only hosts the frontend. Deploy backend separately.

### Recommended: Railway

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy API Server
cd backend/api-server
railway up

# Deploy Signaling Server
cd ../signaling-server
railway up

# Add PostgreSQL
railway add --plugin postgresql

# Add Redis
railway add --plugin redis

# Get service URLs
railway domain

# Update Vercel environment variables with backend URLs
```

### Alternative: Render

1. Go to https://render.com
2. Create New → Web Service
3. Connect GitHub repository
4. Configure:
   - **Name**: cloud-device-lab-api
   - **Environment**: Node
   - **Build Command**: `cd backend/api-server && npm install && npm run build`
   - **Start Command**: `cd backend/api-server && npm start`
5. Add Environment Variables
6. Create Service
7. Repeat for signaling server

### Alternative: Docker Compose (VPS/Cloud VM)

```bash
# On your server
git clone https://github.com/tchiboub-dot/sandbox.git
cd sandbox
docker-compose up -d

# Get API URL
echo "http://YOUR_SERVER_IP:5000"
```

---

## ✅ Step 6: Update Frontend with Backend URLs

After deploying backend:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update:
   ```
   VITE_API_BASE_URL = https://your-api.railway.app
   VITE_SIGNALING_URL = https://your-signaling.railway.app
   ```
3. Redeploy frontend:
   ```powershell
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```
   Or in Vercel Dashboard: Deployments → ⋮ → Redeploy

---

## ✅ Step 7: Test Full Stack

1. **Test Frontend**: Visit https://your-project.vercel.app
2. **Check API Connection**: Open browser console, look for API errors
3. **Test WebSocket**: Check signaling server connection
4. **Create Test Session**: Try launching a device

---

## 📋 Deployment Checklist

- [x] Git repository initialized
- [x] All files committed
- [x] Remote origin configured
- [ ] Pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added
- [ ] Frontend deployed successfully
- [ ] Backend API deployed
- [ ] Signaling server deployed
- [ ] Database configured
- [ ] Redis configured
- [ ] Frontend can connect to backend
- [ ] Custom domain configured (optional)
- [ ] SSL/TLS enabled
- [ ] Monitoring setup

---

## 🔧 Environment Variables Reference

### Frontend (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_BASE_URL` | `https://api.example.com` | Yes |
| `VITE_SIGNALING_URL` | `https://signaling.example.com` | Yes |
| `VITE_STUN_SERVER` | `stun:stun.l.google.com:19302` | Yes |
| `VITE_TURN_SERVER` | `turn:turn.example.com:3478` | No |
| `VITE_ENABLE_DEBUG` | `false` | No |
| `VITE_ENABLE_ANALYTICS` | `false` | No |

### Backend API (Railway/Render)

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `5000` | Yes |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Yes |
| `REDIS_HOST` | `redis.railway.internal` | Yes |
| `REDIS_PORT` | `6379` | Yes |
| `CORS_ORIGIN` | `https://your-project.vercel.app` | Yes |

### Signaling Server (Railway/Render)

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | Yes |
| `PORT` | `5001` | Yes |
| `REDIS_HOST` | `redis.railway.internal` | Yes |
| `REDIS_PORT` | `6379` | Yes |
| `CORS_ORIGIN` | `https://your-project.vercel.app` | Yes |

---

## 🆘 Troubleshooting

### Push to GitHub fails

```powershell
# Check remote
git remote -v

# Check branch
git branch

# Force push (if needed)
git push -f origin main
```

### Vercel build fails

1. Check build logs in Vercel Dashboard
2. Verify `frontend/package.json` has all dependencies
3. Test build locally: `cd frontend && npm run build`
4. Check environment variables are set

### Frontend can't connect to backend

1. Check browser console for CORS errors
2. Verify backend CORS allows Vercel domain
3. Check environment variables in Vercel
4. Verify backend is running: `curl https://your-api.com/health`

### WebRTC not working

1. Check STUN/TURN server configuration
2. Verify signaling server WebSocket connection
3. Check browser console for WebRTC errors
4. Test on different network (some block WebRTC)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [GitHub Authentication](https://docs.github.com/en/authentication)
- [Project README](README.md)
- [Vercel Deployment Guide](VERCEL_DEPLOYMENT.md)

---

## 🎉 Success!

Once deployed, your Cloud Device Lab will be accessible at:
- **Frontend**: https://your-project.vercel.app
- **API**: https://your-api.railway.app
- **Signaling**: https://your-signaling.railway.app

Share your deployment URL and enjoy! 🚀
