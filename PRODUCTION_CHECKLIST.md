# Cloud Device Lab Production Checklist

## 1. Frontend (Vercel)
- Confirm Vercel project root is `frontend`.
- Confirm framework preset is `Vite`.
- Confirm SPA rewrites are active via `frontend/vercel.json`.
- Set environment variables:
  - `VITE_API_URL` or `VITE_API_BASE_URL`
  - `VITE_SIGNALING_URL`
  - `VITE_STUN_SERVER`
- Redeploy after any env update.

## 2. Backend Services
- Deploy API server (`backend/api-server`) to a public HTTPS endpoint.
- Deploy signaling server (`backend/signaling-server`) to a public HTTPS/WSS endpoint.
- Verify health endpoints:
  - `GET /health` on API server
  - `GET /health` on signaling server
- Configure CORS:
  - `CORS_ORIGIN=https://<your-vercel-domain>`
  - `CORS_ALLOW_VERCEL_PREVIEWS=true` for preview deployments

## 3. Data Services
- Provision PostgreSQL database.
- Provision Redis instance.
- Configure backend env vars:
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
  - `REDIS_URL` or equivalent host/port values

## 4. Security and Access
- Enforce HTTPS for all public endpoints.
- Restrict backend access by CORS and network rules.
- Store secrets only in platform secret managers (Vercel/hosted backend).
- Rotate credentials and API keys before go-live.

## 5. Session and VM Runtime
- Verify VM host pool endpoints are reachable.
- Ensure Android/Windows provisioning scripts are available on VM hosts.
- Validate launch, restart, reset, screenshot, and end-session flows.

## 6. Observability
- Deploy Prometheus/Grafana stack (`infrastructure/monitoring`).
- Scrape API and signaling metrics.
- Define alert rules for:
  - High error rate
  - High CPU/memory
  - Session creation failures
  - VM host unavailability

## 7. Performance Validation
- Confirm route code-splitting and chunking in production build.
- Run Lighthouse on dashboard and admin pages.
- Verify mobile rendering and interaction quality.

## 8. Final Go-Live Tests
- Open dashboard, admin, and deep links (`/admin`, `/session/:id`) directly.
- Launch Android device and verify stream controls.
- Launch Windows machine and verify controls.
- Confirm error states are actionable and readable.
- Validate footer links and legal reserved-rights card.

## 9. Rollback Plan
- Keep previous production deployment active until verification passes.
- Record previous stable backend and frontend versions.
- Prepare one-click rollback in hosting provider dashboards.

## 10. Post-Launch Monitoring (First 24h)
- Monitor launch failure rates and API latency.
- Monitor signaling connection success rates.
- Track session duration and error logs.
- Validate no CORS/network regressions from real user traffic.
