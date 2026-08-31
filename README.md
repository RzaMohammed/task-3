# Face Identification & Blockchain Verification Pipeline

A production-quality monorepo architecture for the **Face Identification & Blockchain Verification Pipeline**.

---

## 1. Current State: Module 1 — Project Foundation & Environment Setup

This repository is currently at **Module 1: Project Foundation & Environment Setup**. 

The goal of this module is to establish a clean monorepo architecture, configure dependencies, set up environment configurations, and verify that all service foundations and health endpoints are operational.

> [!IMPORTANT]
> The following functional capabilities are **NOT** implemented in Module 1 and will be introduced in subsequent modules:
> *   Face detection & 512-D embedding extraction
> *   Web / visual reverse-image search
> *   Face embedding cosine similarity matching
> *   SHA-256 deterministic canonical JSON fingerprinting
> *   Solana Devnet blockchain transactions
> *   On-chain integrity verification & tamper detection

---

## 2. Project Architecture & Structure

```text
face-blockchain-verifier/
│
├── frontend/             # React + TypeScript + Vite + Tailwind CSS
├── backend/              # Node.js + TypeScript + Express API
├── ai-service/           # Python 3.11+ + FastAPI service
├── blockchain/           # (Placeholder for Module 5 - Blockchain integration)
├── hashing/              # (Placeholder for Module 4 - Hashing system)
├── search/               # (Placeholder for Module 3 - Visual search)
├── tests/                # Test suites
├── docs/                 # Documentation
│
├── .env.example          # Environment variables template
├── .gitignore            # Git exclusion definitions
├── README.md             # Project documentation
└── docker-compose.yml    # Container orchestration configuration
```

---

## 3. Prerequisites

*   **Node.js**: v18.0.0 or higher
*   **npm**: v9.0.0 or higher
*   **Python**: v3.11 or higher
*   **Docker & Docker Compose** (Optional, for containerized execution)

---

## 4. Installation

### 1. Clone & Setup Environment
```bash
cp .env.example .env
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

### 4. Setup Python AI Service Virtual Environment
```bash
cd ../ai-service
python -m venv .venv
# On Windows:
.venv\Scripts\pip install -r requirements.txt
# On Linux/macOS:
.venv/bin/pip install -r requirements.txt
```

---

## 5. Starting the Services

Start each service in a separate terminal:

### A. Python AI Service (Port 8000)
```bash
cd ai-service
# Windows:
.venv\Scripts\uvicorn app.main:app --port 8000 --reload
# Linux/macOS:
.venv/bin/uvicorn app.main:app --port 8000 --reload
```
Health Check: `GET http://localhost:8000/health`  
Returns:
```json
{
  "success": true,
  "service": "ai-service",
  "status": "running"
}
```

### B. Node.js Express Backend (Port 5000)
```bash
cd backend
npm run dev
```
Health Check: `GET http://localhost:5000/api/health`  
Returns:
```json
{
  "success": true,
  "service": "backend",
  "status": "running"
}
```

### C. React Frontend (Port 5173)
```bash
cd frontend
npm run dev
```
Access the application at `http://localhost:5173`.  
Displays:
```text
Face Identification & Blockchain Verification

System Status: Ready
```

---

## 6. Running with Docker

You can also run all three services using Docker Compose:
```bash
docker-compose up --build
```
*   Frontend: `http://localhost:5173`
*   Backend: `http://localhost:5000/api/health`
*   AI Service: `http://localhost:8000/health`

---

## 7. Environment Variables (`.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Application environment | `development` |
| `BACKEND_PORT` | Port for Express backend | `5000` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |
| `AI_SERVICE_URL` | Address of Python AI Service | `http://localhost:8000` |
| `SEARCH_PROVIDER` | Reverse search provider | `(Configured in Module 3)` |
| `MATCH_THRESHOLD` | Minimum similarity threshold | `0.85` |
| `SOLANA_NETWORK` | Blockchain network | `devnet` |

---

## 8. Upcoming Modules

*   **Module 2**: AI / Face Detection & Encoding Service (InsightFace + OpenCV integration)
*   **Module 3**: Visual / Reverse-Image Search Provider Abstraction (SerpApi Google Lens)
*   **Module 4**: Face Embedding Comparison & Deterministic SHA-256 Hashing System
*   **Module 5**: Solana Devnet Memo Blockchain Upload & Storage
*   **Module 6**: Blockchain Verification & Tamper Detection Engine
*   **Module 7**: Frontend UI Dashboard & Workbench Integration
