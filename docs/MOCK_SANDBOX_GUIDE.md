# Mock Sandbox Mode - Quick Start Guide

## Overview

The Cloud Device Lab platform includes a **Mock Sandbox Engine** that simulates device provisioning without requiring actual VM infrastructure. This allows you to:

- **Demo the platform** without setting up VM hosts
- **Develop and test** frontend features locally
- **Verify the launch flow** end-to-end

## How It Works

When mock mode is enabled (default), the backend simulates:

1. ✅ VM provisioning with realistic delays
2. ✅ Session creation and lifecycle management
3. ✅ Device restart, reset, and deletion
4. ✅ Screenshot capture (placeholder image)
5. ✅ All API responses match production format

## Configuration

### Enable Mock Mode (Default)

Set in `backend/api-server/.env`:

```env
MOCK_SANDBOX=true
```

Or simply omit the variable — mock mode is enabled by default.

### Disable Mock Mode (Production)

To use real VM infrastructure:

```env
MOCK_SANDBOX=false
VM_HOST_POOL=your-vm-host-1:8080,your-vm-host-2:8080
```

## Launch Flow

### Frontend Request

When you click "Launch Android Device" or "Launch Windows Machine":

```
POST /api/sessions
{
  "type": "android",
  "version": "Android 13",
  "screenResolution": "1080x2340",
  ...
}
```

### Backend Response (Mock Mode)

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Session Status

Query the session:

```
GET /api/sessions/{sessionId}
```

Response:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "vmId": "mock-vm-a1b2c3d4",
  "streamUrl": "/stream/550e8400-e29b-41d4-a716-446655440000",
  "deviceConfig": { ... },
  "createdAt": "2026-03-09T10:30:00.000Z",
  "expiresAt": "2026-03-09T11:30:00.000Z"
}
```

## Features Supported

| Feature | Mock Mode | Production Mode |
|---------|-----------|-----------------|
| Launch Android | ✅ Simulated | ✅ Real VM |
| Launch Windows | ✅ Simulated | ✅ Real VM |
| Restart Device | ✅ Simulated | ✅ Real VM |
| Reset Device | ✅ Simulated | ✅ Real VM |
| End Session | ✅ Simulated | ✅ Real VM |
| Screenshot | ✅ Placeholder | ✅ Real capture |
| Stream URL | ✅ Mock path | ✅ Real WebRTC |
| Session Expiry | ✅ Tracked | ✅ Tracked |

## Logging

Mock mode includes detailed logging:

```
[VMOrchestrator] Mock sandbox mode enabled - sessions will be simulated
[MockSandbox] Creating android VM for session 550e8400...
[MockSandbox] Config: Android 13, 1080x2340, 4GB, 4 cores
[MockSandbox] VM created: mock-vm-a1b2c3d4 for session 550e8400...
[MockSandbox] Stream URL: /stream/550e8400...
```

## Error Handling

Mock mode simulates realistic delays but does not fail. If you want to test error scenarios, you'll need to:

1. Disable mock mode
2. Configure invalid VM hosts
3. Observe connection failures

## Transition to Production

To switch from mock to production:

1. **Set up VM infrastructure**
   - Deploy Android emulator hosts
   - Deploy Windows VM hosts
   - Ensure they expose the required APIs

2. **Update environment**

```env
MOCK_SANDBOX=false
VM_HOST_POOL=10.0.1.10:8080,10.0.1.11:8080
```

3. **Verify VM host endpoints**

Each VM host must expose:
- `GET /health` — Health check
- `POST /api/android/create` — Create Android emulator
- `POST /api/windows/create` — Create Windows VM
- `POST /api/vm/:id/restart` — Restart VM
- `POST /api/vm/:id/reset` — Reset VM
- `DELETE /api/vm/:id` — Delete VM
- `GET /api/vm/:id/screenshot` — Capture screenshot

4. **Restart the backend**

```bash
npm run build
npm start
```

## FAQ

### Q: How do I know if mock mode is active?

**A:** Check the backend logs on startup:

```
[VMOrchestrator] Mock sandbox mode enabled - sessions will be simulated
```

### Q: Can I test the UI without the backend?

**A:** No, the frontend requires the backend API. But with mock mode, you don't need VM infrastructure.

### Q: Does mock mode persist sessions?

**A:** Sessions are stored in the database normally. Only VM provisioning is mocked.

### Q: Can I mix mock and real VMs?

**A:** No. Mock mode is global. Either all sessions are mocked or none.

### Q: What happens if I launch in mock mode then disable it?

**A:** Existing mock sessions will fail when you try to interact with them (restart/reset), because the backend will try to reach non-existent VM hosts.

## Support

For issues or questions:
- Check backend logs
- Review environment configuration
- Ensure database is running
- Verify CORS settings for frontend

---

**Mock mode is perfect for demos, development, and testing. For production deployments, configure real VM infrastructure and disable mock mode.**
