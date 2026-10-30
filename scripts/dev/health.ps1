# SkillVerse Comprehensive Operational Health Script
# scripts/dev/health.ps1

param (
    [switch]$Detailed
)

$ErrorActionPreference = "SilentlyContinue"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path
$backendDir = Join-Path $repoRoot "Backend"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       SkillVerse Platform Comprehensive Health Check    " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$allPassed = $true
$checks = @()

# --- 1. PostgreSQL Connection & Migrations ---
$pgResult = [PSCustomObject]@{
    Check       = "PostgreSQL Database & Migrations"
    Status      = "FAIL"
    Message     = ""
    LatencyMs   = 0
}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Push-Location $backendDir
    $script = @"
const db = require('./src/config/db');
(async () => {
    try {
        const client = await db.pool.connect();
        const rMig = await client.query('SELECT count(*) as count FROM schema_migrations;');
        const rUsers = await client.query('SELECT count(*) as count FROM users;');
        const rQueue = await client.query('SELECT count(*) as count FROM indexing_queue;');
        console.log(JSON.stringify({
            success: true,
            migrations: parseInt(rMig.rows[0].count, 10),
            users: parseInt(rUsers.rows[0].count, 10),
            queue_items: parseInt(rQueue.rows[0].count, 10)
        }));
        client.release();
        process.exit(0);
    } catch(e) {
        console.log(JSON.stringify({ success: false, error: e.message }));
        process.exit(1);
    }
})();
"@
    $out = node -e "$($script -replace "`r`n", " ")" 2>&1
    Pop-Location
    $sw.Stop()
    $pgResult.LatencyMs = [int]$sw.ElapsedMilliseconds

    $parsed = $null
    try { $parsed = $out | ConvertFrom-Json } catch {}

    if ($parsed -and $parsed.success) {
        $pgResult.Status = "PASS"
        $pgResult.Message = "Connected to DB ($($pgResult.LatencyMs)ms). Migrations applied: $($parsed.migrations), Registered users: $($parsed.users), Queue items: $($parsed.queue_items)"
    } else {
        $allPassed = $false
        $errMsg = if ($parsed -and $parsed.error) { $parsed.error } else { $out }
        $pgResult.Message = "Database check failed: $errMsg"
    }
} catch {
    Pop-Location
    $sw.Stop()
    $allPassed = $false
    $pgResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $pgResult.Message = "PostgreSQL probe threw exception: $($_.Exception.Message)"
}
$checks += $pgResult

# --- 2. Node.js Backend API Readiness ---
$nodeResult = [PSCustomObject]@{
    Check       = "Node.js Backend Readiness & Health"
    Status      = "FAIL"
    Message     = ""
    LatencyMs   = 0
}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $sw.Stop()
    $nodeResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    if ($res.status -eq "healthy" -and $res.database -eq "connected") {
        $nodeResult.Status = "PASS"
        $nodeResult.Message = "HTTP 200 OK ($($nodeResult.LatencyMs)ms). Backend healthy; Database: connected"
    } else {
        $allPassed = $false
        $nodeResult.Message = "Backend response degraded: status=$($res.status), database=$($res.database)"
    }
} catch {
    $sw.Stop()
    $allPassed = $false
    $nodeResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $nodeResult.Message = "Backend API is unreachable on http://localhost:3000/health ($($_.Exception.Message))"
}
$checks += $nodeResult

# --- 3. FastAPI AI Microservice Health & Model Availability ---
$fastApiResult = [PSCustomObject]@{
    Check       = "FastAPI AI Microservice & Models"
    Status      = "FAIL"
    Message     = ""
    LatencyMs   = 0
}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $sw.Stop()
    $fastApiResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    if ($res.status -eq "ok") {
        $idxCount = if ($res.indexed_candidates -ne $null) { $res.indexed_candidates } else { "N/A" }
        $fastApiResult.Status = "PASS"
        $fastApiResult.Message = "HTTP 200 OK ($($fastApiResult.LatencyMs)ms). Live Index: $($res.live_index) ($idxCount candidates), Ranker: $($res.ranker)"
    } else {
        $allPassed = $false
        $fastApiResult.Message = "FastAPI returned non-ok health: $($res.status)"
    }
} catch {
    $sw.Stop()
    $allPassed = $false
    $fastApiResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $fastApiResult.Message = "FastAPI AI microservice unreachable on http://127.0.0.1:8000/api/v1/health ($($_.Exception.Message))"
}
$checks += $fastApiResult

# --- 4. Node-to-FastAPI Integration Check ---
$integrationResult = [PSCustomObject]@{
    Check       = "Node-to-FastAPI Service Integration"
    Status      = "FAIL"
    Message     = ""
    LatencyMs   = 0
}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Push-Location $backendDir
    $script = @"
const { callMLForMatches } = require('./src/services/ml.service');
(async () => {
    try {
        const dummyJob = { id: 999999, title: 'HealthCheck Software Engineer', required_skills: ['JavaScript'], experience_min: 0, experience_max: 5 };
        const matches = await callMLForMatches(dummyJob, 2);
        console.log(JSON.stringify({ success: true, count: Array.isArray(matches) ? matches.length : 0 }));
        process.exit(0);
    } catch(e) {
        console.log(JSON.stringify({ success: false, error: e.message }));
        process.exit(1);
    }
})();
"@
    $out = node -e "$($script -replace "`r`n", " ")" 2>&1
    Pop-Location
    $sw.Stop()
    $integrationResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $parsed = $null
    try { $parsed = $out | ConvertFrom-Json } catch {}

    if ($parsed -and $parsed.success) {
        $integrationResult.Status = "PASS"
        $integrationResult.Message = "Successful Node-to-FastAPI call ($($integrationResult.LatencyMs)ms). Service token verified; AI Matching pipeline operational"
    } else {
        $allPassed = $false
        $errMsg = if ($parsed -and $parsed.error) { $parsed.error } else { $out }
        $integrationResult.Message = "Integration probe failed: $errMsg"
    }
} catch {
    Pop-Location
    $sw.Stop()
    $allPassed = $false
    $integrationResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $integrationResult.Message = "Integration probe threw exception: $($_.Exception.Message)"
}
$checks += $integrationResult

# --- 5. Vite Frontend HTTP Availability ---
$viteResult = [PSCustomObject]@{
    Check       = "Frontend (Vite Dev Server)"
    Status      = "FAIL"
    Message     = ""
    LatencyMs   = 0
}
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $res = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $sw.Stop()
    $viteResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    if ($res.StatusCode -eq 200) {
        $viteResult.Status = "PASS"
        $viteResult.Message = "HTTP 200 OK ($($viteResult.LatencyMs)ms). React UI ready at http://localhost:5173"
    } else {
        $allPassed = $false
        $viteResult.Message = "Vite returned unexpected status code: $($res.StatusCode)"
    }
} catch {
    $sw.Stop()
    $allPassed = $false
    $viteResult.LatencyMs = [int]$sw.ElapsedMilliseconds
    $viteResult.Message = "Frontend unreachable on http://localhost:5173 ($($_.Exception.Message))"
}
$checks += $viteResult

# Format output
foreach ($c in $checks) {
    $color = if ($c.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "[$($c.Status)] " -ForegroundColor $color -NoNewline
    Write-Host "$($c.Check)" -ForegroundColor White
    Write-Host "       $($c.Message)`n" -ForegroundColor Gray
}

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " OVERALL STATUS: ALL SERVICES OPERATIONAL AND HEALTHY   " -ForegroundColor Green
    Write-Host "--------------------------------------------------------`n" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host " OVERALL STATUS: ONE OR MORE HEALTH CHECKS FAILED       " -ForegroundColor Yellow
    Write-Host "--------------------------------------------------------`n" -ForegroundColor Cyan
    exit 1
}
