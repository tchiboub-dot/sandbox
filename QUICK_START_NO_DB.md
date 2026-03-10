# Quick Start - No Database Required

If you just want to test the frontend **without a real database**, use this:

## Step 1: Kill any existing Node processes

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## Step 2: Start Backend API (Mock Mode)

Open a **NEW PowerShell terminal** and run:

```powershell
cd c:\Users\mlap\OneDrive\Desktop\appli-complete\sandbox-android-wind\backend\api-server
npm install
npm run build
npm start
```

This will start the API on **http://localhost:5000**

## Step 3: Start Frontend

Open **ANOTHER NEW PowerShell terminal** and run:

```powershell
cd c:\Users\mlap\OneDrive\Desktop\appli-complete\sandbox-android-wind\frontend
npm install
npm run dev
```

This will start the frontend on **http://localhost:3001** (or 3000 if available)

## Step 4: Test It

1. Go to http://localhost:3001
2. You should see the app without errors
3. The frontend can now reach the backend API at http://localhost:5000

---

# Option 2: COMPLETE - Use Docker (Requires Installation)

If you want a **full working environment** with real database:

## Install Docker Desktop for Windows

1. Download: https://www.docker.com/products/docker-desktop
2. Install and restart your computer
3. Verify installation:
   ```powershell
   docker --version
   docker compose --version
   ```

## Then run (from repo root):

```powershell
# Start database services
docker compose up -d postgres redis

# Start backend
cd backend\api-server
npm install
npm start

# Start frontend (in new terminal)
npm run dev --workspace frontend
```

---

# Option 3: Install PostgreSQL + Redis Locally on Windows

If you prefer not to use Docker:

1. **PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Redis**: https://github.com/microsoftarchive/redis/releases (Windows port)
3. Then run backend and frontend normally

---

# Current Status

- ✅ Frontend builds successfully
- ✅ Backend builds successfully  
- ❌ Database not installed (need Docker or SQL Server installation)
- ❌ Redis not installed (need Docker or Redis installation)

**Recommendation: Use Option 1 (Mock Mode) to test immediately, then Option 2 (Docker) for full functionality.**
