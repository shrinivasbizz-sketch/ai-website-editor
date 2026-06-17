# Start both the Python agent backend and Next.js frontend
Write-Host "Starting AI Website Editor..." -ForegroundColor Cyan

# Check Python is available
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Please install Python 3.10+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Install Python deps if needed
$venvPath = ".\backend\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv $venvPath
    & "$venvPath\Scripts\pip" install -r .\backend\requirements.txt --quiet
    Write-Host "Python deps installed." -ForegroundColor Green
}

# Start Python backend in background
Write-Host "Starting Python agent on http://localhost:8000 ..." -ForegroundColor Yellow
$pythonJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    & ".\.venv\Scripts\uvicorn" main:app --port 8000 --reload 2>&1
}

Start-Sleep -Seconds 2

# Start Next.js frontend
Write-Host "Starting Next.js on http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Editor ready at http://localhost:3000" -ForegroundColor Green
Write-Host "Agent API   at http://localhost:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Gray
Write-Host ""

npm run dev
