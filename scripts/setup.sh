#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================================="
echo "      Verification Pipeline Installation Wizard (Bash)"
echo "=========================================================="

# 1. Check Prerequisites
echo "[1/4] Checking system prerequisites..."

if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed. Please install Node.js v18+ and try again."
    exit 1
fi
echo "✓ Node.js: $(node -v)"

if ! command -v python3 &> /dev/null; then
    echo "✗ Python is not installed. Please install Python 3.11+ and add it to your PATH."
    exit 1
fi
echo "✓ Python: $(python3 --version)"

# 2. Setup AI Service (Python venv)
echo -e "\n[2/4] Setting up Python AI Service..."
cd "$(dirname "$0")/../ai-service"

if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment in ./ai-service/.venv..."
    python3 -m venv .venv
fi

echo "Upgrading pip and installing requirements..."
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
echo "✓ Python AI Service requirements installed successfully."

# 3. Setup Backend Orchestrator
echo -e "\n[3/4] Installing backend dependencies..."
cd "../backend"
npm install
echo "✓ Backend npm dependencies installed."

# 4. Setup Frontend UI
echo -e "\n[4/4] Installing frontend dependencies..."
cd "../frontend"
npm install
echo "✓ Frontend npm dependencies installed."

# 5. Environment Config
cd ".."
if [ ! -f ".env" ]; then
    echo -e "\nCopying .env.example to .env..."
    cp .env.example .env
    echo "✓ Environment config .env created. Please add SerpApi and Solana Private Keys."
else
    echo -e "\n✓ Local .env already exists. Skipping copy."
fi

echo "=========================================================="
echo "           Setup completed successfully!"
echo "=========================================================="
echo "To run the application locally:"
echo "1. Run Python service:  cd ai-service && .venv/bin/uvicorn app.main:app --reload --port 8000"
echo "2. Run Node.js backend:  cd backend && npm run dev"
echo "3. Run React frontend:  cd frontend && npm run dev"
echo "=========================================================="
