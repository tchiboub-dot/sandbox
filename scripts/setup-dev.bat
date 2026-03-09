@echo off
REM Quick setup script for Cloud Device Lab development environment (Windows)

echo =========================================
echo Cloud Device Lab - Development Setup
echo =========================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Node.js is not installed. Please install Node.js 18+
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Docker is not installed. Please install Docker Desktop
    exit /b 1
)

docker info >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo X Docker is not running. Please start Docker Desktop
    exit /b 1
)

echo √ Prerequisites check passed
echo.

REM Create environment files
echo Creating environment files...

if not exist "backend\api-server\.env" (
    copy "backend\api-server\.env.example" "backend\api-server\.env" >nul
    echo √ Created backend\api-server\.env
)

if not exist "backend\signaling-server\.env" (
    copy "backend\signaling-server\.env.example" "backend\signaling-server\.env" >nul
    echo √ Created backend\signaling-server\.env
)

if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env" >nul
    echo √ Created frontend\.env
)

echo.

REM Install dependencies
echo Installing dependencies...
echo.

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo Installing API server dependencies...
cd backend\api-server
call npm install
cd ..\..

echo Installing signaling server dependencies...
cd backend\signaling-server
call npm install
cd ..\..

echo √ All dependencies installed
echo.

REM Start Docker services
echo Starting Docker services (PostgreSQL, Redis, Monitoring)...
docker-compose up -d postgres redis prometheus grafana

echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo √ Services started
echo.

REM Display access information
echo =========================================
echo Setup Complete!
echo =========================================
echo.
echo Services are ready:
echo.
echo To start the development servers:
echo.
echo 1. Frontend (Terminal 1):
echo    cd frontend
echo    npm run dev
echo    Access: http://localhost:3000
echo.
echo 2. API Server (Terminal 2):
echo    cd backend\api-server
echo    npm run dev
echo    Access: http://localhost:5000
echo.
echo 3. Signaling Server (Terminal 3):
echo    cd backend\signaling-server
echo    npm run dev
echo    Access: http://localhost:5001
echo.
echo Monitoring:
echo    Grafana: http://localhost:3001 (admin/admin)
echo    Prometheus: http://localhost:9090
echo.
echo Database:
echo    PostgreSQL: localhost:5432
echo    Redis: localhost:6379
echo.
echo To stop services:
echo    docker-compose down
echo.
echo Happy coding!
echo =========================================
pause
