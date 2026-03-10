# Android Emulator Sandbox Implementation

## Overview

This document describes the implementation of an Android emulator launcher and management system for the Cloud Device Lab application.

## Architecture

### Backend API (`/backend/api/sandbox/`)

#### 1. **Launch Endpoint** (`launch.js`)
- **Route:** `POST /api/sandbox/launch`
- **Purpose:** Initiates an Android emulator session
- **Request Body:**
  ```json
  {
    "emulatorName": "default",
    "timeout": 300000
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "sessionId": "uuid",
    "message": "Emulator launch initiated",
    "estimatedWaitTime": "60-120 seconds"
  }
  ```
- **Features:**
  - CORS handling
  - UUID-based session ID generation
  - In-memory session storage (production: use database)
  - Simulated async launch with 2-second startup delay
  - Error handling and proper HTTP status codes

#### 2. **Session Status Endpoint** (`session.js`)
- **Route:** `GET /api/sandbox/session/:sessionId`
- **Purpose:** Query the status of a running session
- **Query Parameters:**
  - `sessionId` (required): The session ID returned from launch
- **Response:**
  ```json
  {
    "success": true,
    "session": {
      "id": "uuid",
      "status": "running|launching|stopped|error",
      "emulatorName": "default",
      "port": 5037,
      "createdAt": "ISO timestamp",
      "startedAt": "ISO timestamp",
      "uptime": "100 seconds"
    }
  }
  ```
- **Features:**
  - CORS handling
  - Session lookup and status reporting
  - Mock implementation (production: fetch from database)
  - Error handling

### Frontend Components

#### 1. **SandboxService** (`services/sandboxService.ts`)
- **Purpose:** Provides type-safe API client functions
- **Key Functions:**
  - `launchEmulator(options)` - POST to launch endpoint
  - `getSessionStatus(sessionId)` - GET session details
  - `pollSessionStatus(sessionId, options)` - Polls with configurable interval and timeout
- **Features:**
  - TypeScript interfaces for request/response types
  - Automatic CORS handling
  - Polling utility with timeout and status change callbacks
  - Error handling and retry logic

#### 2. **SandboxLauncher Component** (`components/SandboxLauncher.tsx`)
- **Purpose:** React UI for emulator launch and management
- **Features:**
  - Launch button with loading state
  - Session ID display
  - Real-time status updates
  - Countdown timer showing estimated wait time
  - Progress bar visualization
  - Error display
  - Automatic polling for status updates
- **UI States:**
  - Initial: Show launch button
  - Loading: Show progress and countdown
  - Success: Display session details and status
  - Error: Show error message

#### 3. **Styles** (`styles/SandboxLauncher.css`)
- Modern gradient design matching app theme
- Responsive layout
- Smooth animations and transitions
- Status color indicators

### Configuration

#### Vercel Configuration (`vercel.json`)
```json
{
  "routes": [
    {
      "src": "/api/sandbox/launch",
      "dest": "/api/sandbox/launch.js",
      "methods": ["POST", "OPTIONS"]
    },
    {
      "src": "/api/sandbox/session/(?<sessionId>[^/]+)",
      "dest": "/api/sandbox/session.js?sessionId=$sessionId",
      "methods": ["GET", "OPTIONS"]
    }
  ]
}
```

#### Environment Variables
- `VITE_API_URL` or `VITE_API_BASE_URL`: API base URL (defaults to `/api`)

## Data Flow

### Launch Emulator Flow

```
Client Browser
     ↓
SandboxLauncher Component (UI)
     ↓
launchEmulator() (SandboxService)
     ↓
POST /api/sandbox/launch
     ↓
Backend: launch.js Handler
     ├─ Generate Session ID
     ├─ Create Session Object
     ├─ Store in sessions Map
     ├─ Schedule async startup (2 sec delay)
     └─ Return Session ID
     ↓
Return to UI: { sessionId, message, estimatedWaitTime }
     ↓
Start Polling: pollSessionStatus()
     ├─ Poll every 15 seconds
     ├─ GET /api/sandbox/session/:sessionId
     ├─ Update UI with status
     └─ Continue until "running" status
     ↓
Display Session Details to User
```

### Session Query Flow

```
Client → GET /api/sandbox/session/:sessionId
         ↓
Backend: session.js Handler
         ├─ Parse sessionId from query
         ├─ Fetch session from storage
         └─ Return session details
         ↓
         Response: { success, session }
```

## Usage

### For Users

1. Click "Launch Emulator" button
2. Wait for emulator to start (2-5 minutes estimated)
3. Monitor progress bar and countdown
4. When status shows "RUNNING", emulator is ready
5. Session ID is displayed for reference

### For Developers

#### Integrating into App

```tsx
import SandboxLauncher from './components/SandboxLauncher';

export function MyPage() {
  return (
    <div>
      <SandboxLauncher />
    </div>
  );
}
```

#### Using SandboxService Directly

```tsx
import { launchEmulator, pollSessionStatus } from './services/sandboxService';

async function startEmulator() {
  try {
    const result = await launchEmulator({ emulatorName: 'pixel5' });
    console.log('Session ID:', result.sessionId);
    
    const status = await pollSessionStatus(result.sessionId, {
      pollInterval: 10000, // 10 seconds
      maxDuration: 600000, // 10 minutes
    });
    
    console.log('Emulator ready at port:', status.port);
  } catch (error) {
    console.error('Failed to launch:', error);
  }
}
```

## Production Considerations

### Immediate TODOs

1. **Database Integration**
   - Replace in-memory `sessions` Map with database fetch
   - Store session start time and metadata
   - Implement session cleanup/TTL

2. **Real Emulator Launch**
   - Implement actual Android emulator startup
   - Handle emulator process management
   - Detect emulator readiness via ADB

3. **Error Handling**
   - Validate emulator name
   - Handle emulator startup failures
   - Implement retry logic with backoff

4. **Security**
   - Add authentication/authorization
   - Validate session ownership
   - Implement rate limiting
   - Add input validation

5. **Monitoring**
   - Add logging of session lifecycle
   - Track emulator resources
   - Monitor port allocation

6. **Testing**
   - Unit tests for API handlers
   - Integration tests for service layer
   - E2E tests for component flow

### Environment Setup

Create `.env.local` in frontend/:
```
VITE_API_URL=http://localhost:3000/api
# OR
VITE_API_BASE_URL=http://localhost:3000
```

### Deployment

1. Ensure backend files are in Vercel `public/api` or `api` directory
2. Update `vercel.json` with correct rewrites
3. Deploy frontend and backend together
4. Test API routes in production

## Testing

### Manual Testing

1. **Launch endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/sandbox/launch \
     -H "Content-Type: application/json" \
     -d '{"emulatorName": "default"}'
   ```

2. **Session endpoint:**
   ```bash
   curl http://localhost:3000/api/sandbox/session/<SESSION_ID>
   ```

3. **UI Testing:**
   - Click launch button
   - Monitor countdown and progress
   - Verify session details display

## File Structure

```
├── backend/
│   └── api/
│       └── sandbox/
│           ├── launch.js          # Launch endpoint
│           └── session.js         # Session status endpoint
├── frontend/
│   └── src/
│       ├── components/
│       │   └── SandboxLauncher.tsx    # React component
│       ├── services/
│       │   └── sandboxService.ts      # API client
│       └── styles/
│           └── SandboxLauncher.css    # Component styles
└── vercel.json                        # Vercel routing config
```

## References

- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [TypeScript Types](https://www.typescriptlang.org/docs/)
