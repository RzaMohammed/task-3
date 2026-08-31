# Face Identification & Blockchain Verification Setup Script for Windows (PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      Verification Pipeline Installation Wizard" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Prerequisites
Write-Host "[1/4] Checking system prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node -v
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Error "✗ Node.js is not installed. Please install Node.js v18+ and try again."
    Exit 1
}

try {
    $pythonVersion = python --version
    Write-Host "✓ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Error "✗ Python is not installed. Please install Python 3.11+ and add it to your PATH."
    Exit 1
}

# 2. Setup AI Service (Python venv)
Write-Host "`n[2/4] Setting up Python AI Service..." -ForegroundColor Yellow
$aiPath = Join-Path $PSScriptRoot "../ai-service"

if (-not (Test-Path (Join-Path $aiPath ".venv"))) {
    Write-Host "Creating Python virtual environment in $aiPath/.venv..." -ForegroundColor Gray
    Start-Process python -ArgumentList "-m venv .venv" -WorkingDirectory $aiPath -NoNewWindow -Wait
}

Write-Host "Upgrading pip and installing requirements..." -ForegroundColor Gray
$pipPath = Join-Path $aiPath ".venv\Scripts\pip.exe"
Start-Process $pipPath -ArgumentList "install --upgrade pip" -WorkingDirectory $aiPath -NoNewWindow -Wait
Start-Process $pipPath -ArgumentList "install -r requirements.txt" -WorkingDirectory $aiPath -NoNewWindow -Wait
Write-Host "✓ Python AI Service requirements installed successfully." -ForegroundColor Green

# 3. Setup Backend Orchestrator
Write-Host "`n[3/4] Installing backend dependencies..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "../backend"
Start-Process npm -ArgumentList "install" -WorkingDirectory $backendPath -NoNewWindow -Wait
Write-Host "✓ Backend npm dependencies installed." -ForegroundColor Green

# 4. Setup Frontend UI
Write-Host "`n[4/4] Installing frontend dependencies..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "../frontend"
Start-Process npm -ArgumentList "install" -WorkingDirectory $frontendPath -NoNewWindow -Wait
Write-Host "✓ Frontend npm dependencies installed." -ForegroundColor Green

# 5. Environment Config
$envPath = Join-Path $PSScriptRoot "../.env"
$envExPath = Join-Path $PSScriptRoot "../.env.example"
if (-not (Test-Path $envPath)) {
    Write-Host "`nCopying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item $envExPath $envPath
    Write-Host "✓ Environment config .env created. Please add SerpApi and Solana Private Keys." -ForegroundColor Green
} else {
    Write-Host "`n✓ Local .env already exists. Skipping copy." -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "           Setup completed successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To run the application locally:" -ForegroundColor White
Write-Host "1. Run Python service:  cd ai-service; .venv\Scripts\uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host "2. Run Node.js backend:  cd backend; npm run dev" -ForegroundColor Gray
Write-Host "3. Run React frontend:  cd frontend; npm run dev" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
