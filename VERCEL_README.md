# Vercel Deployment Configuration

This file is automatically detected by Vercel and configures the build process.

## Framework Detection

Vercel automatically detects this as a **Vite** project.

## Build Settings

- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`
- **Development Command**: `cd frontend && npm run dev`

## Environment Variables Required

Set these in Vercel Dashboard → Settings → Environment Variables:

### Production Variables
```
VITE_API_BASE_URL=https://your-api-server.railway.app
VITE_SIGNALING_URL=https://your-signaling-server.railway.app
VITE_STUN_SERVER=stun:stun.l.google.com:19302
```

### Optional Variables
```
VITE_TURN_SERVER=turn:turn.example.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_PASSWORD=password
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=false
VITE_MAX_SESSION_DURATION=7200
VITE_SESSION_WARNING_TIME=300
```

## Routes Configuration

The `vercel.json` file configures:
- Static asset serving from `/assets/`
- SPA fallback routing (all routes → `index.html`)
- Cache headers for assets (1 year)

## Important Notes

1. **Frontend Only**: Vercel deploys only the React frontend
2. **Backend Required**: Deploy API and Signaling servers separately (Railway/Render/AWS)
3. **Database Required**: PostgreSQL must be hosted separately
4. **Redis Required**: Redis cache must be hosted separately
5. **Environment Variables**: Must be set in Vercel dashboard before deployment

## Testing Locally

```bash
# Install dependencies
cd frontend
npm install

# Build
npm run build

# Preview production build
npm run preview
```

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to https://vercel.com/new
   - Import `tchiboub-dot/sandbox`
   - Configure build settings (or use vercel.json auto-detection)
   - Add environment variables
   - Deploy

3. **Verify Deployment**:
   - Check build logs
   - Visit deployed URL
   - Test API connectivity
   - Check browser console for errors

## Troubleshooting

### Build Fails
- Ensure Node.js 18+ is used (default on Vercel)
- Check all dependencies are in `frontend/package.json`
- Verify build command is correct
- Check build logs for specific errors

### 404 on Routes
- Verify `vercel.json` routing configuration
- Check SPA fallback is working
- Test with `/` route first

### Environment Variables Not Working
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
