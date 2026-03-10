# Cloud Device Lab - Vercel Deployment

⚠️ **Important Note**: This Vercel deployment hosts **only the frontend** React application. The backend services (API Server, Signaling Server, PostgreSQL, Redis, and VM hosts) must be deployed separately.

## What's Deployed on Vercel

- ✅ **Frontend React App** - User interface, dashboard, and WebRTC viewer
- ❌ Backend API Server (deploy to Railway, Render, or AWS)
- ❌ Signaling Server (deploy to Railway, Render, or AWS)
- ❌ Database & Redis (use managed services)
- ❌ VM Infrastructure (requires Kubernetes cluster)

## Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tchiboub-dot/sandbox)

## Environment Variables Required

Configure these in Vercel Dashboard → Settings → Environment Variables:

### Required Variables
```
VITE_API_BASE_URL=https://your-api-server.com
VITE_SIGNALING_URL=https://your-signaling-server.com
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

### Optional Variables
```
VITE_TURN_SERVER=turn:turn.example.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

## Backend Deployment Options

Since Vercel is for frontend/serverless, deploy backend separately:

### Option 1: Railway (Recommended for Docker)
1. Create Railway account
2. Deploy backend services using docker-compose
3. Connect PostgreSQL and Redis
4. Get service URLs

### Option 2: Render
1. Create Render account
2. Deploy as Web Services
3. Use managed PostgreSQL and Redis
4. Configure environment variables

### Option 3: AWS/Azure/GCP
1. Use ECS/Container Apps/Cloud Run for containers
2. RDS/Azure Database/Cloud SQL for PostgreSQL
3. ElastiCache/Azure Cache/Memorystore for Redis
4. ALB/App Gateway/Load Balancer for routing

### Option 4: Full Kubernetes
Follow [DEPLOYMENT.md](DEPLOYMENT.md) for complete Kubernetes setup.

## Local Development

```bash
# Install dependencies
npm install
npm install --workspace frontend

# Start development server
npm run dev
```

Access at http://localhost:3000

## Production Build Test

```bash
# Build frontend
npm --workspace frontend run build

# Preview production build
npm --workspace frontend run preview
```

## Vercel CLI Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Architecture for Vercel Deployment

```
┌─────────────────────────────────────────┐
│         Vercel CDN (Global Edge)        │
│         Frontend Static Site            │
└────────────────┬────────────────────────┘
                 │
                 │ API Calls
                 │
┌────────────────▼────────────────────────┐
│      Backend Services (Railway/AWS)     │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  API Server  │  │ Signaling Server│ │
│  └──────┬───────┘  └────────┬────────┘ │
│         │                   │          │
│  ┌──────▼────────┐  ┌───────▼───────┐ │
│  │  PostgreSQL   │  │     Redis     │ │
│  └───────────────┘  └───────────────┘ │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Build Fails
- Check Node version (use Node 18+)
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Variables are available at build time, not runtime

### API Calls Failing
- Update VITE_API_BASE_URL to actual backend URL
- Enable CORS on backend for Vercel domain
- Check network tab for errors

### WebRTC Not Connecting
- Update VITE_SIGNALING_URL to actual signaling server
- Configure TURN server for production
- Check WebSocket connection

## Next Steps After Deployment

1. ✅ Deploy frontend to Vercel
2. 🔧 Deploy backend to Railway/Render/AWS
3. 🔗 Update environment variables with backend URLs
4. 🎨 Configure custom domain in Vercel
5. 📊 Set up monitoring and analytics
6. 🔒 Enable security headers
7. 🚀 Test full flow end-to-end

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Project Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)

---

**Note**: This is a frontend-only deployment. For the complete platform with VM capabilities, follow the full Kubernetes deployment guide.
