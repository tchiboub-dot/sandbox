# API Documentation - Cloud Device Lab

Complete REST API and WebSocket API documentation.

## Base URLs

- **Development**: `http://localhost:5000`
- **Production**: `https://api.clouddevicelab.com`

## Authentication

Currently, the API is open. For production, implement JWT-based authentication:

```http
Authorization: Bearer <token>
```

## REST API Endpoints

### Sessions

#### Create Session

Create a new device session and launch VM.

**Endpoint**: `POST /api/sessions`

**Request Body**:
```json
{
  "type": "android" | "windows",
  "version": "Android 13" | "Windows 11",
  "resolution": "1080x1920" | "1920x1080",
  "connection": "4G" | "3G" | "WiFi",
  "ram": 2048 | 4096 | 8192,
  "cpu": 2 | 4 | 8,
  "storage": 32 | 64 | 128,
  "timezone": "America/New_York",
  "locale": "en-US",
  "gpsEnabled": true | false,
  "rootAccess": true | false,
  "cameraEnabled": true | false,
  "microphoneEnabled": true | false
}
```

**Response** (201 Created):
```json
{
  "sessionId": "uuid-v4",
  "status": "starting",
  "device": {
    "type": "android",
    "version": "Android 13",
    "vmId": "vm-12345",
    "hostIp": "10.0.1.5"
  },
  "createdAt": "2024-03-09T10:00:00Z",
  "expiresAt": "2024-03-09T11:00:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid parameters
- `503 Service Unavailable`: No available VM hosts

---

#### Get Session

Retrieve session details.

**Endpoint**: `GET /api/sessions/:sessionId`

**Response** (200 OK):
```json
{
  "sessionId": "uuid-v4",
  "status": "running" | "starting" | "stopping" | "stopped",
  "device": {
    "type": "android",
    "version": "Android 13",
    "vmId": "vm-12345",
    "hostIp": "10.0.1.5",
    "streamUrl": "wss://signaling.example.com"
  },
  "config": {
    "resolution": "1080x1920",
    "ram": 4096,
    "cpu": 4
  },
  "createdAt": "2024-03-09T10:00:00Z",
  "expiresAt": "2024-03-09T11:00:00Z",
  "duration": 3600,
  "remainingTime": 2400
}
```

**Error Responses**:
- `404 Not Found`: Session not found

---

#### List Sessions

List all active sessions (admin).

**Endpoint**: `GET /api/sessions`

**Query Parameters**:
- `status`: Filter by status (running, starting, stopped)
- `type`: Filter by device type (android, windows)
- `limit`: Max results (default: 50)
- `offset`: Pagination offset

**Response** (200 OK):
```json
{
  "sessions": [
    {
      "sessionId": "uuid-v4",
      "status": "running",
      "device": { ... },
      "createdAt": "2024-03-09T10:00:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

---

#### Extend Session

Extend session duration.

**Endpoint**: `POST /api/sessions/:sessionId/extend`

**Request Body**:
```json
{
  "additionalMinutes": 30
}
```

**Response** (200 OK):
```json
{
  "sessionId": "uuid-v4",
  "newExpiresAt": "2024-03-09T11:30:00Z",
  "remainingTime": 5400
}
```

**Error Responses**:
- `400 Bad Request`: Invalid duration
- `404 Not Found`: Session not found
- `409 Conflict`: Maximum duration exceeded

---

#### Restart Session

Restart the VM (soft reboot).

**Endpoint**: `POST /api/sessions/:sessionId/restart`

**Response** (200 OK):
```json
{
  "sessionId": "uuid-v4",
  "status": "restarting",
  "message": "Device is restarting"
}
```

---

#### Reset Session

Reset VM to initial state (hard reset).

**Endpoint**: `POST /api/sessions/:sessionId/reset`

**Response** (200 OK):
```json
{
  "sessionId": "uuid-v4",
  "status": "resetting",
  "message": "Device is being reset"
}
```

---

#### End Session

Terminate session and destroy VM.

**Endpoint**: `DELETE /api/sessions/:sessionId`

**Response** (200 OK):
```json
{
  "sessionId": "uuid-v4",
  "status": "stopped",
  "message": "Session ended successfully"
}
```

---

### Admin

#### Get Statistics

Get platform statistics (admin).

**Endpoint**: `GET /api/admin/stats`

**Response** (200 OK):
```json
{
  "activeSessions": 42,
  "totalSessions": 1523,
  "vmHosts": {
    "total": 10,
    "available": 8,
    "capacity": 100
  },
  "devices": {
    "android": 25,
    "windows": 17
  },
  "resources": {
    "cpuUsage": 45.2,
    "memoryUsage": 65.8,
    "storageUsage": 32.1
  }
}
```

---

#### Get System Health

Check system health (admin).

**Endpoint**: `GET /api/admin/health`

**Response** (200 OK):
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "vmHosts": "healthy"
  },
  "uptime": 86400,
  "version": "1.0.0"
}
```

---

#### Get Logs

Retrieve system logs (admin).

**Endpoint**: `GET /api/admin/logs`

**Query Parameters**:
- `level`: Filter by level (info, warn, error)
- `service`: Filter by service name
- `limit`: Max results (default: 100)
- `since`: ISO timestamp

**Response** (200 OK):
```json
{
  "logs": [
    {
      "timestamp": "2024-03-09T10:00:00Z",
      "level": "info",
      "service": "api-server",
      "message": "Session created",
      "sessionId": "uuid-v4"
    }
  ],
  "total": 1000,
  "limit": 100
}
```

---

## WebSocket API (Signaling Server)

### Connection

**URL**: `wss://signaling.example.com`

**Connection**:
```javascript
const socket = io('wss://signaling.example.com', {
  query: { sessionId: 'uuid-v4' }
});
```

---

### Events

#### Client → Server

##### `join-session`

Join a device session.

**Payload**:
```json
{
  "sessionId": "uuid-v4"
}
```

**Response**: `session-joined` or `error`

---

##### `webrtc-offer`

Send WebRTC offer to VM.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

**Response**: `webrtc-answer`

---

##### `webrtc-ice-candidate`

Send ICE candidate.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "candidate": {
    "candidate": "...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

---

##### `input-event`

Send input event to VM.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "type": "mouse" | "keyboard" | "touch",
  "data": {
    "x": 100,
    "y": 200,
    "button": "left" | "right",
    "key": "Enter",
    "action": "down" | "up" | "move"
  }
}
```

---

##### `android-control`

Send Android-specific control (calls, SMS, GPS).

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "action": "simulate-call" | "simulate-sms" | "set-location",
  "data": {
    "phoneNumber": "+1234567890",
    "message": "Test message",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

---

#### Server → Client

##### `session-joined`

Confirmation of successful join.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "status": "ready"
}
```

---

##### `webrtc-answer`

WebRTC answer from VM.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}
```

---

##### `webrtc-ice-candidate`

ICE candidate from VM.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "candidate": {
    "candidate": "...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

---

##### `session-status`

Session status update.

**Payload**:
```json
{
  "sessionId": "uuid-v4",
  "status": "running" | "stopping" | "stopped",
  "message": "Device is ready"
}
```

---

##### `error`

Error message.

**Payload**:
```json
{
  "error": "Error message",
  "code": "SESSION_NOT_FOUND"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Request validation failed |
| `SESSION_NOT_FOUND` | Session ID not found |
| `SESSION_EXPIRED` | Session has expired |
| `VM_CREATE_FAILED` | Failed to create VM |
| `NO_AVAILABLE_HOSTS` | No VM hosts available |
| `RESOURCE_LIMIT` | Resource limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |

---

## Rate Limiting

- **Anonymous**: 10 requests/minute
- **Authenticated**: 100 requests/minute
- **Admin**: 1000 requests/minute

**Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1678370400
```

---

## Webhooks (Future)

Subscribe to events via webhooks:

- `session.created`
- `session.started`
- `session.ended`
- `session.expired`
- `error.occurred`

---

## SDKs

### JavaScript/TypeScript

```typescript
import { CloudDeviceLab } from '@clouddevicelab/sdk';

const client = new CloudDeviceLab({
  apiUrl: 'https://api.clouddevicelab.com',
  apiKey: 'your-api-key'
});

// Create session
const session = await client.sessions.create({
  type: 'android',
  version: 'Android 13'
});

// Connect to device
await session.connect();

// Send input
session.sendInput({ type: 'touch', x: 100, y: 200 });

// End session
await session.end();
```

### Python

```python
from clouddevicelab import Client

client = Client(
    api_url='https://api.clouddevicelab.com',
    api_key='your-api-key'
)

# Create session
session = client.sessions.create(
    type='android',
    version='Android 13'
)

# Wait for ready
session.wait_until_ready()

# End session
session.end()
```

---

## Examples

### Create and Connect to Android Device

```javascript
// 1. Create session
const response = await fetch('https://api.clouddevicelab.com/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'android',
    version: 'Android 13',
    resolution: '1080x1920'
  })
});

const { sessionId } = await response.json();

// 2. Connect to signaling server
const socket = io('wss://signaling.clouddevicelab.com', {
  query: { sessionId }
});

// 3. Setup WebRTC
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

// 4. Handle WebRTC events
socket.on('webrtc-answer', async ({ answer }) => {
  await pc.setRemoteDescription(answer);
});

socket.on('webrtc-ice-candidate', async ({ candidate }) => {
  await pc.addIceCandidate(candidate);
});

// 5. Create offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('webrtc-offer', { sessionId, offer });
```

---

## Testing

Use the included Postman collection for API testing:

```bash
# Import collection
postman import cloud-device-lab.postman_collection.json
```

Or use curl:

```bash
# Create session
curl -X POST http://localhost:5000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"type":"android","version":"Android 13"}'

# Get session
curl http://localhost:5000/api/sessions/<sessionId>

# End session
curl -X DELETE http://localhost:5000/api/sessions/<sessionId>
```

---

## Support

For API support:
- Documentation: https://docs.clouddevicelab.com
- GitHub Issues: https://github.com/clouddevicelab/issues
- Email: api@clouddevicelab.com
