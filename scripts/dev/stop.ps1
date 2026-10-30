# SkillVerse Safe Service Termination Script
# scripts/dev/stop.ps1

param (
    [switch]$IncludeDatabase
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host "`n=== Stopping SkillVerse Development Services ===" -ForegroundColor Cyan

function Stop-ProjectProcess {
    param (
        [int]$Port,
        [string]$ServiceName,
        [string[]]$AllowedPatterns
    )

    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $conn) {
        Write-Host "[-] $ServiceName (Port $Port) is not running." -ForegroundColor Gray
        return
    }

    $pidToStop = $conn.OwningProcess
    $wmiProc = Get-WmiObject win32_process -Filter "ProcessId = $pidToStop" -ErrorAction SilentlyContinue

    if (-not $wmiProc) {
        Write-Host "[!] Could not inspect process details for PID $pidToStop on port $Port." -ForegroundColor Yellow
        return
    }

    $cmdLine = $wmiProc.CommandLine
    $procName = $wmiProc.Name

    # Verify that the process belongs to SkillVerse
    $matchesPattern = $false
    foreach ($pat in $AllowedPatterns) {
        if ($cmdLine -and $cmdLine -match [regex]::Escape($pat)) {
            $matchesPattern = $true
            break
        }
    }

    if ($matchesPattern) {
        Write-Host "[+] Stopping $ServiceName (PID: $pidToStop, Process: $procName)..." -ForegroundColor Yellow
        try {
            # Also terminate any child processes spawned by this PID
            $children = Get-WmiObject win32_process -Filter "ParentProcessId = $pidToStop" -ErrorAction SilentlyContinue
            if ($children) {
                foreach ($child in $children) {
                    Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue
                }
            }
            Stop-Process -Id $pidToStop -Force -ErrorAction Stop
            Start-Sleep -Milliseconds 500
            Write-Host "[OK] $ServiceName stopped successfully." -ForegroundColor Green
        } catch {
            Write-Host "[!] Failed to stop PID $($pidToStop): $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "[!] SAFETY CHECK: Process on port $Port (PID $pidToStop, $procName) does not match SkillVerse signatures. Not terminating." -ForegroundColor Yellow
        Write-Host "    CommandLine: $cmdLine" -ForegroundColor DarkGray
    }
}

# 1. Stop Frontend (Vite)
Stop-ProjectProcess -Port 5173 -ServiceName "Frontend (Vite)" -AllowedPatterns @("vite", "SkillVerse\Frontend", "Frontend", "node.exe")

# 2. Stop Node.js Backend API
Stop-ProjectProcess -Port 3000 -ServiceName "Node.js Backend" -AllowedPatterns @("server.js", "SkillVerse\Backend", "Backend", "node.exe")

# 3. Stop FastAPI AI Microservice
Stop-ProjectProcess -Port 8000 -ServiceName "FastAPI AI Microservice" -AllowedPatterns @("uvicorn", "app.main:app", "SkillVerse", "python.exe")

# 4. Stop PostgreSQL (Optional)
if ($IncludeDatabase) {
    Write-Host "[+] Explicit -IncludeDatabase requested. Stopping PostgreSQL..." -ForegroundColor Yellow
    $pgCtl = "D:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
    $pgData = "D:\Program Files\PostgreSQL\18\data"
    if ((Test-Path $pgCtl) -and (Test-Path $pgData)) {
        & $pgCtl stop -D $pgData -m fast
        Write-Host "[OK] PostgreSQL stop requested via pg_ctl." -ForegroundColor Green
    } else {
        Stop-ProjectProcess -Port 5432 -ServiceName "PostgreSQL" -AllowedPatterns @("postgres", "PostgreSQL\18")
    }
} else {
    Write-Host "[-] PostgreSQL left running on port 5432 (pass -IncludeDatabase to stop database)." -ForegroundColor DarkGray
}

Write-Host "`n=== Service Termination Complete ===`n" -ForegroundColor Cyan
