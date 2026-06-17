#!/usr/bin/env pwsh
# AI Website Editor — one-command install for Windows
# Usage: .\install.ps1

Write-Host ""
Write-Host "  ✏  AI Website Editor" -ForegroundColor Magenta
Write-Host "  Open-source visual AI editor for any website" -ForegroundColor Gray
Write-Host ""

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "  ERROR: Python not found." -ForegroundColor Red
  Write-Host "  Install from https://python.org (3.10+)" -ForegroundColor Yellow
  exit 1
}

$pyver = python --version 2>&1
Write-Host "  Python: $pyver" -ForegroundColor Green

# Create venv and install deps
$venv = ".\backend\.venv"
if (-not (Test-Path $venv)) {
  Write-Host "  Creating Python environment..." -ForegroundColor Cyan
  python -m venv $venv
}

Write-Host "  Installing Python dependencies..." -ForegroundColor Cyan
& "$venv\Scripts\pip" install -r .\backend\requirements.txt --quiet

Write-Host ""
Write-Host "  ✓ Ready!" -ForegroundColor Green
Write-Host ""
Write-Host "  Start the agent:" -ForegroundColor White
Write-Host "    cd backend" -ForegroundColor Gray
Write-Host "    .\.venv\Scripts\uvicorn main:app --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  Then open http://localhost:8000 to get your script tag." -ForegroundColor White
Write-Host ""
