#!/usr/bin/env pwsh
# ============================================================
# HireMind AI — Local Development Startup Script
# Starts: Frontend (Next.js) + Backend API (FastAPI/Uvicorn)
# Run: .\start-local.ps1
# ============================================================

$ErrorActionPreference = "Continue"
$ROOT = $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  HireMind AI v1.0.0 - Local Startup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ── Environment Setup ──────────────────────────────────────
$env:ENV_FILE_PATH = "$ROOT\.env.local"
$env:PYTHONPATH = "$ROOT;$ROOT\libs;$ROOT\apps\api-gateway\src;$ROOT\libs\config\src;$ROOT\libs\telemetry\src;$ROOT\libs\security\src;$ROOT\libs\auth\src;$ROOT\libs\db-core\src;$ROOT\libs\shared-schemas\src;$ROOT\libs\events\src"
$env:NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000"
$env:PYTHONUNBUFFERED = "1"

Write-Host "[INFO] PYTHONPATH configured" -ForegroundColor Green
Write-Host "[INFO] ENV_FILE_PATH = $env:ENV_FILE_PATH" -ForegroundColor Green
Write-Host "[INFO] PYTHONUNBUFFERED = 1" -ForegroundColor Green

# ── Check Dependencies ─────────────────────────────────────
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Yellow

$python = python --version 2>&1
Write-Host "  Python: $python" -ForegroundColor Green

$node = node --version 2>&1
Write-Host "  Node:   $node" -ForegroundColor Green

$pnpm = pnpm.cmd --version 2>&1
Write-Host "  pnpm:   $pnpm" -ForegroundColor Green

$uvicorn = python -c "import uvicorn; print(uvicorn.__version__)" 2>&1
Write-Host "  uvicorn: $uvicorn" -ForegroundColor Green

# ── Start API Gateway ──────────────────────────────────────
Write-Host ""
Write-Host "Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor DarkGray

$apiJob = Start-Job -ScriptBlock {
    param($root, $pythonPath, $envFile)
    $env:PYTHONPATH = $pythonPath
    $env:ENV_FILE_PATH = $envFile
    $env:PYTHONUNBUFFERED = "1"
    Set-Location "$root\apps\api-gateway\src"
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1
} -ArgumentList $ROOT, $env:PYTHONPATH, $env:ENV_FILE_PATH

Write-Host "  API process started (Job ID: $($apiJob.Id))" -ForegroundColor Green

# Give API a moment to initialize
Start-Sleep -Seconds 3

# ── Start Frontend Dev Server ──────────────────────────────
Write-Host ""
Write-Host "Starting Next.js Frontend on http://localhost:3000 ..." -ForegroundColor Yellow

$webJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\web"
    & pnpm.cmd dev 2>&1
} -ArgumentList $ROOT

Write-Host "  Frontend process started (Job ID: $($webJob.Id))" -ForegroundColor Green

# ── Monitor Output ─────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Services Running:" -ForegroundColor Cyan
Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "  API:        http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health:     http://localhost:8000/health" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services..." -ForegroundColor DarkGray
Write-Host ""

# Stream output from both jobs
try {
    while ($true) {
        # API output
        $apiOutput = Receive-Job -Job $apiJob 2>&1
        if ($apiOutput) {
            $apiOutput | ForEach-Object { Write-Host "[API] $_" -ForegroundColor DarkCyan }
        }
        
        # Web output
        $webOutput = Receive-Job -Job $webJob 2>&1
        if ($webOutput) {
            $webOutput | ForEach-Object { Write-Host "[WEB] $_" -ForegroundColor DarkGreen }
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    Stop-Job -Job $apiJob, $webJob
    Remove-Job -Job $apiJob, $webJob
    Write-Host "All services stopped." -ForegroundColor Green
}
