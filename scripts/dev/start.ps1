# SkillVerse Reproducible Local Service Startup Script
# scripts/dev/start.ps1

param (
    [switch]$NoFrontend
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..\..")).Path

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       Starting SkillVerse Local Development Services    " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# Helper to check if a port is listening
function Test-PortListening {
    param ([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    return ($null -ne $conn)
}

function Start-DetachedProcess {
    param (
        [string]$CommandLine,
        [string]$WorkingDirectory
    )
    $args = @{ CommandLine = $CommandLine }
    if ($WorkingDirectory) {
        $args.CurrentDirectory = $WorkingDirectory
    }
    $res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments $args
    return $res.ProcessId
}

# Ensure logs directories exist
$backendLogs = Join-Path $repoRoot "Backend\logs"
if (-not (Test-Path $backendLogs)) { New-Item -ItemType Directory -Path $backendLogs -Force | Out-Null }
$frontendLogs = Join-Path $repoRoot "Frontend\logs"
if (-not (Test-Path $frontendLogs)) { New-Item -ItemType Directory -Path $frontendLogs -Force | Out-Null }

# --- STEP 1: PostgreSQL ---
Write-Host "[1/4] Checking PostgreSQL (Port 5432)..." -ForegroundColor White
$pgReadyExe = "D:\Program Files\PostgreSQL\18\bin\pg_isready.exe"
if (-not (Test-Path $pgReadyExe)) {
    $pgCmd = Get-Command "pg_isready" -ErrorAction SilentlyContinue
    if ($pgCmd) { $pgReadyExe = $pgCmd.Source }
}

$pgRunning = $false
if (Test-PortListening -Port 5432) {
    if (Test-Path $pgReadyExe) {
        & $pgReadyExe -h 127.0.0.1 -p 5432 -U postgres 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $pgRunning = $true
            Write-Host "  [OK] PostgreSQL is already active and accepting connections on port 5432." -ForegroundColor Green
        }
    } else {
        $pgRunning = $true
        Write-Host "  [OK] PostgreSQL port 5432 is listening." -ForegroundColor Green
    }
}

if (-not $pgRunning) {
    Write-Host "  [+] Starting PostgreSQL database server..." -ForegroundColor Yellow
    $pgCtl = "D:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
    $pgData = "D:\Program Files\PostgreSQL\18\data"
    $pgLog = "$pgData\pg_server.log"

    if ((Test-Path $pgCtl) -and (Test-Path $pgData)) {
        $pgStartCmd = "`"$pgCtl`" start -D `"$pgData`" -l `"$pgLog`""
        Start-DetachedProcess -CommandLine $pgStartCmd
    } else {
        $pgStartCmd = "`"postgres`" -D `"$pgData`""
        Start-DetachedProcess -CommandLine $pgStartCmd
    }

    Write-Host "  [*] Waiting for PostgreSQL readiness..." -ForegroundColor Gray
    $timeout = 40
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        if (Test-PortListening -Port 5432) {
            if (Test-Path $pgReadyExe) {
                & $pgReadyExe -h 127.0.0.1 -p 5432 -U postgres 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $pgRunning = $true
                    break
                }
            } else {
                $pgRunning = $true
                break
            }
        }
    }

    if ($pgRunning) {
        Write-Host "  [OK] PostgreSQL is ready and accepting connections ($elapsed seconds)." -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] PostgreSQL failed to start or become ready within $timeout seconds." -ForegroundColor Red
        Write-Host "          Check logs in: $pgData\log" -ForegroundColor Yellow
        exit 1
    }
}

# --- STEP 2: FastAPI AI Microservice ---
Write-Host "`n[2/4] Checking FastAPI AI Microservice (Port 8000)..." -ForegroundColor White
$faRunning = $false
if (Test-PortListening -Port 8000) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "ok") {
            $faRunning = $true
            Write-Host "  [OK] FastAPI AI microservice is already running on port 8000." -ForegroundColor Green
        }
    } catch {}
}

if (-not $faRunning) {
    $pythonExe = Join-Path $repoRoot "Backend\.venv\Scripts\python.exe"
    if (-not (Test-Path $pythonExe)) {
        Write-Host "  [ERROR] Python virtual environment not found at: $pythonExe" -ForegroundColor Red
        exit 1
    }

    $faLog = Join-Path $backendLogs "fastapi.log"
    Write-Host "  [+] Starting FastAPI via uvicorn on http://127.0.0.1:8000..." -ForegroundColor Yellow

    $backendDir = Join-Path $repoRoot "Backend"
    $faCmd = "cmd.exe /c `"`"$pythonExe`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 > `"$faLog`" 2>&1`""
    Start-DetachedProcess -CommandLine $faCmd -WorkingDirectory $backendDir | Out-Null

    Write-Host "  [*] Waiting for FastAPI readiness..." -ForegroundColor Gray
    $timeout = 30
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        try {
            $res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
            if ($res.status -eq "ok") {
                $faRunning = $true
                break
            }
        } catch {}
    }

    if ($faRunning) {
        Write-Host "  [OK] FastAPI AI microservice is ready ($elapsed seconds). Live Index: $($res.live_index)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] FastAPI failed to start within $timeout seconds." -ForegroundColor Red
        Write-Host "          Check logs at: $faLog" -ForegroundColor Yellow
        exit 1
    }
}

# --- STEP 3: Node.js Backend API ---
Write-Host "`n[3/4] Checking Node.js Core Backend (Port 3000)..." -ForegroundColor White
$nodeRunning = $false
if (Test-PortListening -Port 3000) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "healthy" -and $res.database -eq "connected") {
            $nodeRunning = $true
            Write-Host "  [OK] Node.js backend is already running on port 3000 (Database connected)." -ForegroundColor Green
        }
    } catch {}
}

if (-not $nodeRunning) {
    $nodeLog = Join-Path $backendLogs "backend.log"
    Write-Host "  [+] Starting Node.js backend on http://localhost:3000..." -ForegroundColor Yellow

    $backendDir = Join-Path $repoRoot "Backend"
    $nodeCmd = "cmd.exe /c `"node server.js > `"$nodeLog`" 2>&1`""
    Start-DetachedProcess -CommandLine $nodeCmd -WorkingDirectory $backendDir | Out-Null

    Write-Host "  [*] Waiting for Node.js backend readiness..." -ForegroundColor Gray
    $timeout = 25
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        Start-Sleep -Seconds 1
        $elapsed++
        try {
            $res = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
            if ($res.status -eq "healthy" -and $res.database -eq "connected") {
                $nodeRunning = $true
                break
            }
        } catch {}
    }

    if ($nodeRunning) {
        Write-Host "  [OK] Node.js backend is ready ($elapsed seconds). Background indexing worker active." -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Node.js backend failed to start within $timeout seconds." -ForegroundColor Red
        Write-Host "          Check logs at: $nodeLog" -ForegroundColor Yellow
        exit 1
    }
}

# --- STEP 4: Frontend (Vite) ---
if ($NoFrontend) {
    Write-Host "`n[4/4] Frontend start skipped (-NoFrontend flag specified)." -ForegroundColor DarkGray
} else {
    Write-Host "`n[4/4] Checking Frontend Dev Server (Port 5173)..." -ForegroundColor White
    $viteRunning = $false
    if (Test-PortListening -Port 5173) {
        try {
            $res = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 3 -ErrorAction Stop
            if ($res.StatusCode -eq 200) {
                $viteRunning = $true
                Write-Host "  [OK] Frontend Vite server is already running on port 5173." -ForegroundColor Green
            }
        } catch {}
    }

    if (-not $viteRunning) {
        $viteLog = Join-Path $frontendLogs "frontend.log"
        Write-Host "  [+] Starting Vite dev server on http://localhost:5173..." -ForegroundColor Yellow

        $frontendDir = Join-Path $repoRoot "Frontend"
        $viteCmd = "cmd.exe /c `"npm run dev > `"$viteLog`" 2>&1`""
        Start-DetachedProcess -CommandLine $viteCmd -WorkingDirectory $frontendDir | Out-Null

        Write-Host "  [*] Waiting for Frontend readiness..." -ForegroundColor Gray
        $timeout = 25
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            Start-Sleep -Seconds 1
            $elapsed++
            try {
                $res = Invoke-WebRequest -Uri "http://localhost:5173" -Method Get -TimeoutSec 2 -ErrorAction Stop
                if ($res.StatusCode -eq 200) {
                    $viteRunning = $true
                    break
                }
            } catch {}
        }

        if ($viteRunning) {
            Write-Host "  [OK] Frontend Vite server is ready ($elapsed seconds)." -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] Frontend failed to start within $timeout seconds." -ForegroundColor Red
            Write-Host "          Check logs at: $viteLog" -ForegroundColor Yellow
            exit 1
        }
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "       SkillVerse Local Environment Successfully Started  " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Frontend Web UI   : http://localhost:5173" -ForegroundColor White
Write-Host "  Core Backend API  : http://localhost:3000" -ForegroundColor White
Write-Host "  FastAPI AI Service: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  PostgreSQL DB     : 127.0.0.1:5432" -ForegroundColor White
Write-Host "`n  Run health check  : .\scripts\dev\health.ps1" -ForegroundColor Gray
Write-Host "  Inspect status    : .\scripts\dev\status.ps1" -ForegroundColor Gray
Write-Host "  Stop all services : .\scripts\dev\stop.ps1" -ForegroundColor Gray
Write-Host "========================================================`n" -ForegroundColor Cyan
