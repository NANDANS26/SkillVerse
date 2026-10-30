# SkillVerse Local Development Status Script
# scripts/dev/status.ps1

param (
    [switch]$Json
)

$ErrorActionPreference = "SilentlyContinue"

function Get-PortProcess {
    param ([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        return [PSCustomObject]@{
            Listening = $true
            Pid       = $conn.OwningProcess
            Name      = if ($proc) { $proc.ProcessName } else { "Unknown" }
        }
    }
    return [PSCustomObject]@{
        Listening = $false
        Pid       = $null
        Name      = $null
    }
}

$results = @()

# 1. PostgreSQL (Port 5432)
$pgPort = 5432
$pgInfo = Get-PortProcess -Port $pgPort
$pgStatus = "Stopped"
$pgDetails = "Port $pgPort not listening"
if ($pgInfo.Listening) {
    # Test connectivity with pg_isready if available
    $isReadyExe = "D:\Program Files\PostgreSQL\18\bin\pg_isready.exe"
    if (-not (Test-Path $isReadyExe)) {
        $isReadyCmd = Get-Command "pg_isready" -ErrorAction SilentlyContinue
        if ($isReadyCmd) { $isReadyExe = $isReadyCmd.Source }
    }
    
    $ready = $false
    if (Test-Path $isReadyExe) {
        $procOut = & $isReadyExe -h 127.0.0.1 -p $pgPort -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
        }
    } else {
        # Fallback TCP check succeeded
        $ready = $true
    }

    if ($ready) {
        $pgStatus = "Running and healthy"
        $pgDetails = "Accepting connections on 127.0.0.1:$pgPort (PID: $($pgInfo.Pid))"
    } else {
        $pgStatus = "Running but unhealthy"
        $pgDetails = "Port $pgPort open but rejecting connections (PID: $($pgInfo.Pid))"
    }
}
$results += [PSCustomObject]@{
    Service = "PostgreSQL"
    Port    = $pgPort
    PID     = $pgInfo.Pid
    Status  = $pgStatus
    Details = $pgDetails
}

# 2. FastAPI AI Service (Port 8000)
$fastApiPort = 8000
$faInfo = Get-PortProcess -Port $fastApiPort
$faStatus = "Stopped"
$faDetails = "Port $fastApiPort not listening"
if ($faInfo.Listening) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:$fastApiPort/api/v1/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "ok") {
            $faStatus = "Running and healthy"
            $faDetails = "ML models loaded; $(if ($res.indexed_candidates) { $res.indexed_candidates } else { 0 }) candidates in live index"
        } else {
            $faStatus = "Running but unhealthy"
            $faDetails = "Returned non-ok health status"
        }
    } catch {
        $faStatus = "Running but unhealthy"
        $faDetails = "Health check failed: $($_.Exception.Message)"
    }
}
$results += [PSCustomObject]@{
    Service = "FastAPI AI Microservice"
    Port    = $fastApiPort
    PID     = $faInfo.Pid
    Status  = $faStatus
    Details = $faDetails
}

# 3. Node.js Backend API (Port 3000)
$nodePort = 3000
$nodeInfo = Get-PortProcess -Port $nodePort
$nodeStatus = "Stopped"
$nodeDetails = "Port $nodePort not listening"
if ($nodeInfo.Listening) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:$nodePort/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.status -eq "healthy" -and $res.database -eq "connected") {
            $nodeStatus = "Running and healthy"
            $nodeDetails = "Express API active; PostgreSQL database connected"
        } elseif ($res.status -eq "healthy") {
            $nodeStatus = "Running and healthy"
            $nodeDetails = "Express API active"
        } else {
            $nodeStatus = "Running but unhealthy"
            $nodeDetails = "Database degraded or disconnected ($($res.database))"
        }
    } catch {
        $nodeStatus = "Running but unhealthy"
        $nodeDetails = "Health check probe failed: $($_.Exception.Message)"
    }
}
$results += [PSCustomObject]@{
    Service = "Node.js Core Backend"
    Port    = $nodePort
    PID     = $nodeInfo.Pid
    Status  = $nodeStatus
    Details = $nodeDetails
}

# 4. Frontend Vite Dev Server (Port 5173)
$vitePort = 5173
$viteInfo = Get-PortProcess -Port $vitePort
$viteStatus = "Stopped"
$viteDetails = "Port $vitePort not listening"
if ($viteInfo.Listening) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:$vitePort" -Method Get -TimeoutSec 3 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $viteStatus = "Running and healthy"
            $viteDetails = "Vite serving React application at http://localhost:$vitePort"
        } else {
            $viteStatus = "Running but unhealthy"
            $viteDetails = "Returned HTTP status code $($res.StatusCode)"
        }
    } catch {
        $viteStatus = "Running but unhealthy"
        $viteDetails = "HTTP probe failed: $($_.Exception.Message)"
    }
}
$results += [PSCustomObject]@{
    Service = "Frontend (Vite + React)"
    Port    = $vitePort
    PID     = $viteInfo.Pid
    Status  = $viteStatus
    Details = $viteDetails
}

if ($Json) {
    $results | ConvertTo-Json -Depth 3
} else {
    Write-Host "`n=== SkillVerse Service Status ===" -ForegroundColor Cyan
    $results | Format-Table -AutoSize
}
