# Deployment Verification Script - Cloud Device Lab
# Run this script to diagnose deployment issues

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     Cloud Device Lab - Deployment Verification Script         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ==================== GIT STATUS ====================
Write-Host "1️⃣  Git Status" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  Uncommitted changes found:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    Write-Host "Run: git add . && git commit -m 'your message'" -ForegroundColor Yellow
} else {
    Write-Host "✅ All changes committed" -ForegroundColor Green
}
Write-Host ""

# ==================== LATEST COMMIT ====================
Write-Host "2️⃣  Latest Commit" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$localLatest = git log --oneline -1
Write-Host "Local: $localLatest" -ForegroundColor Blue

$remoteLatest = git log origin/main --oneline -1
Write-Host "Remote: $remoteLatest" -ForegroundColor Blue

if ($localLatest -eq $remoteLatest) {
    Write-Host "✅ Local and remote commits match" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commits don't match - push may be needed" -ForegroundColor Yellow
    Write-Host "Run: git push origin main" -ForegroundColor Yellow
}
Write-Host ""

# ==================== GIT REMOTE ====================
Write-Host "3️⃣  Git Remote" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

git remote -v
Write-Host ""

# ==================== BUILD STATUS ====================
Write-Host "4️⃣  Build Status (Local)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if (Test-Path ".\frontend\dist\index.html") {
    $distSize = (Get-Item ".\frontend\dist\index.html").Length
    Write-Host "✅ dist/index.html exists ($distSize bytes)" -ForegroundColor Green
    
    $assetCount = @(Get-ChildItem ".\frontend\dist\assets\").Count
    Write-Host "✅ Assets folder: $assetCount files" -ForegroundColor Green
} else {
    Write-Host "⚠️  dist/index.html not found" -ForegroundColor Yellow
    Write-Host "Run: cd frontend && npm run build" -ForegroundColor Yellow
}
Write-Host ""

# ==================== ENVIRONMENT FILES ====================
Write-Host "5️⃣  Environment Configuration" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$envExample = Get-Content ".\frontend\.env.example" -ErrorAction SilentlyContinue | Select-Object -First 15
if ($envExample) {
    Write-Host "Frontend .env.example found:" -ForegroundColor Blue
    Write-Host ($envExample | Select-Object -First 5) -ForegroundColor Gray
    Write-Host "..." -ForegroundColor Gray
} else {
    Write-Host "⚠️  .env.example not found" -ForegroundColor Yellow
}

if (Test-Path ".\frontend\.env") {
    Write-Host ""
    Write-Host "⚠️  frontend/.env file exists (should not be committed)" -ForegroundColor Yellow
    Write-Host "Check .gitignore to ensure .env is ignored" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✅ frontend/.env not found (correct for production)" -ForegroundColor Green
}
Write-Host ""

# ==================== VERCEL CONFIGURATION ====================
Write-Host "6️⃣  Vercel Configuration" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if (Test-Path ".\vercel.json") {
    Write-Host "✅ vercel.json exists" -ForegroundColor Green
    
    $vercelJson = Get-Content ".\vercel.json" | ConvertFrom-Json
    Write-Host "  - buildCommand: $($vercelJson.buildCommand)" -ForegroundColor Gray
    Write-Host "  - outputDirectory: $($vercelJson.outputDirectory)" -ForegroundColor Gray
    Write-Host "  - framework: $($vercelJson.framework)" -ForegroundColor Gray
    
    if ($vercelJson.rewrites) {
        Write-Host "  - rewrites: ✓ Configured" -ForegroundColor Green
    } else {
        Write-Host "  - rewrites: ⚠️  Not configured (SPA routes may fail)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  vercel.json not found" -ForegroundColor Yellow
}
Write-Host ""

# ==================== PACKAGE JSON ====================
Write-Host "7️⃣  Package Configuration" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$packageJson = Get-Content ".\frontend\package.json" | ConvertFrom-Json
Write-Host "Frontend version: $($packageJson.version)" -ForegroundColor Blue
Write-Host "Frontend name: $($packageJson.name)" -ForegroundColor Blue
Write-Host ""
Write-Host "Build scripts:" -ForegroundColor Blue
$packageJson.scripts | Get-Member -MemberType NoteProperty | ForEach-Object {
    $scriptName = $_.Name
    $scriptCmd = $packageJson.scripts.$scriptName
    Write-Host "  npm run $scriptName → $scriptCmd" -ForegroundColor Gray
}
Write-Host ""

# ==================== ROUTES VERIFICATION ====================
Write-Host "8️⃣  Routes Verification" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$appFile = Get-Content ".\frontend\src\App.tsx" -Raw
if ($appFile -match "BrowserRouter") {
    Write-Host "✅ BrowserRouter detected (SPA routing correct)" -ForegroundColor Green
} else {
    Write-Host "⚠️  BrowserRouter not found" -ForegroundColor Yellow
}

if ($appFile -match 'path="/"') {
    Write-Host "✅ Home route (/) found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Home route (/) not found" -ForegroundColor Yellow
}

if ($appFile -match 'path="/admin"') {
    Write-Host "✅ Admin route (/admin) found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Admin route (/admin) not found" -ForegroundColor Yellow
}

if ($appFile -match 'path="/session/:sessionId"') {
    Write-Host "✅ Session route (/session/:id) found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Session route (/session/:id) not found" -ForegroundColor Yellow
}
Write-Host ""

# ==================== API CONFIGURATION ====================
Write-Host "9️⃣  API Configuration" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

if (Test-Path ".\frontend\src\config\api.ts") {
    Write-Host "✅ API config file exists" -ForegroundColor Green
    $apiConfig = Get-Content ".\frontend\src\config\api.ts"
    
    if ($apiConfig -match "VITE_API_URL") {
        Write-Host "✅ API URL configuration found" -ForegroundColor Green
    }
    
    if ($apiConfig -match "normalizeBaseUrl") {
        Write-Host "✅ API URL normalization found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  API config file not found" -ForegroundColor Yellow
}
Write-Host ""

# ==================== DEPLOYMENT FILES ====================
Write-Host "🔟 Documentation Files" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

$docsToCheck = @(
    "DEPLOYMENT_TROUBLESHOOTING.md",
    "DEPLOYMENT_FIXES.md",
    "VERCEL_README.md",
    "API_CONNECTIVITY_GUIDE.md"
)

foreach ($doc in $docsToCheck) {
    if (Test-Path ".\$doc") {
        $size = ((Get-Item ".\$doc").Length / 1024).ToString("F1")
        Write-Host "✅ $doc ($size KB)" -ForegroundColor Green
    } else {
        Write-Host "  $doc (not found)" -ForegroundColor Gray
    }
}
Write-Host ""

# ==================== SUMMARY ====================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                        RECOMMENDATIONS                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verify latest commit is pushed:" -ForegroundColor Cyan
Write-Host "   git log origin/main --oneline -1" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure environment variable (if backend is external):" -ForegroundColor Cyan
Write-Host "   Vercel → Settings → Environment Variables" -ForegroundColor Gray
Write-Host "   Add: VITE_API_URL=your-backend-url/api" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Trigger redeploy:" -ForegroundColor Cyan
Write-Host "   git commit --allow-empty -m 'trigger: fresh deployment'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Test after deployment:" -ForegroundColor Cyan
Write-Host "   Hard refresh: Ctrl+Shift+Delete then Ctrl+Shift+R" -ForegroundColor Gray
Write-Host "   Check console (F12) for errors" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Verification complete!" -ForegroundColor Green
Write-Host ""
