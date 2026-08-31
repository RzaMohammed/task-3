# Face Identification & Blockchain Verification Pipeline

A production-quality monorepo architecture for the **Face Identification & Blockchain Verification Pipeline** (HH Goa 2026 Shortlisting Task 3).

---

## 1. Pipeline Status

* [x] **Module 1**: Project Foundation & Monorepo Setup (Frontend, Backend, AI Service, Docker Compose)
* [x] **Module 2**: Face Detection & Face Encoding (`InsightFace buffalo_l`, 512-D normalized vector, FastAPI)
* [x] **Module 3**: Genuine Visual / Social Media Search (`SerpApi Google Lens`, domain classifier, URL validator)
* [x] **Module 4**: Candidate Face Matching & Genuine Match Selection (Cosine similarity, SSRF guard, threshold ranking)
* [ ] **Module 5**: SHA-256 Data Fingerprinting & Evidence Packaging
* [ ] **Module 6**: Solana Devnet Blockchain Storage
* [ ] **Module 7**: Blockchain Verification & Tamper Detection Engine
* [ ] **Module 8**: Pipeline UI & Visual Verification Dashboard

---

## 2. Module 4 — Candidate Face Matching & Genuine Match Selection

Module 4 compares the input face embedding against candidate images retrieved from the visual web search to isolate the closest genuine match.

### 2.1. Processing Architecture

```text
Input Face
    ↓
InsightFace (512-D Embedding)
    ↓
Search Results (Module 3)
    ↓
Candidate Image URLs
    ↓
In-Memory Candidate Download (SSRF Protected)
    ↓
Candidate Face Detection & Embedding (InsightFace buffalo_l)
    ↓
Cosine Similarity Calculation
    ↓
Descending Rank & Threshold Check (MATCH_THRESHOLD = 0.85)
    ↓
Best Match Result (MATCH_FOUND / NO_CONFIDENT_MATCH)
```

---

### 2.2. Mathematical Foundation: Cosine Similarity

Similarity between the source face vector $\mathbf{u}$ and candidate vector $\mathbf{v}$ is calculated via normalized cosine similarity:

$$\text{similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \times \|\mathbf{v}\|_2}$$

* **Range**: Normalized to `0.0` – `1.0` (with percentage representation e.g. `94.2%`).
* **Vector Safety**: Safely handles zero vectors, non-finite values, and dimension mismatches without division-by-zero errors.

> [!IMPORTANT]
> **Ethical & Safety Notice**: The output is strictly a **Face Similarity Score** between two biometric representations. It is **NOT** a statistical certainty or proof of personal identity.

---

### 2.3. Candidate Status Classification & Safeguards

To prevent false positives, candidates are classified into distinct states:

| Status | Description | Action |
| :--- | :--- | :--- |
| `MATCHED` | Single face detected and cosine similarity $\ge 0.85$. | Eligible for best match. |
| `BELOW_THRESHOLD` | Single face detected but similarity $< 0.85$. | Excluded from match. |
| `NO_FACE` | Zero faces detected in candidate image. | Skipped. |
| `MULTIPLE_FACES` | Ambiguous multiple faces detected. | Skipped to avoid false associations. |
| `IMAGE_DOWNLOAD_FAILED` | Network timeout, 404, or blocked by SSRF filter. | Skipped. |
| `INVALID_IMAGE` | Corrupted image bytes or unsupported format. | Skipped. |

---

### 2.4. SSRF Protections & Privacy

* **SSRF Guard**: Strict rejection of `localhost`, `127.0.0.1`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, and non-HTTP protocols.
* **In-Memory Streaming**: Candidate images are processed strictly in RAM and discarded immediately after inference.
* **No Biometric Vector Logging**: Numerical 512-D vectors are never printed to logs.

---

## 3. Project Architecture & Structure

```text
face-blockchain-verifier/
│
├── frontend/             # React + TypeScript + Vite + Tailwind CSS
├── backend/              # Node.js + Express API + Visual Search + Matching Engine
│   └── src/
│       ├── services/
│       │   ├── search/   # SerpApi Google Lens visual search
│       │   └── matching/ # Candidate fetcher, similarity math, InsightFace client
│       ├── controllers/  # Route handlers
│       └── routes/       # API endpoints
├── ai-service/           # Python 3.11+ + FastAPI + InsightFace (buffalo_l)
├── blockchain/           # (Placeholder for Module 6)
├── hashing/              # (Placeholder for Module 5)
├── search/               # Search documentation and resources
├── tests/                # Jest integration test suites
└── docs/                 # Documentation & search demo guides
```

---

## 4. API Endpoints

### 4.1. Health Check
* `GET http://localhost:5000/api/health`
* `GET http://localhost:8000/health`

### 4.2. Face Detection & Embedding (AI Service)
* `POST http://localhost:8000/api/face/analyze` (Multipart image upload)

### 4.3. Visual Web Search (Backend)
* `POST http://localhost:5000/api/search/image` (Multipart image upload)

### 4.4. Candidate Face Matching (Backend)
* `POST http://localhost:5000/api/matching/run`
```json
{
  "source_embedding": [ ... ],
  "search_results": [
    {
      "id": "result-1",
      "url": "https://www.instagram.com/p/...",
      "imageUrl": "https://...",
      "title": "Public Profile",
      "source": "instagram",
      "resultType": "social_media"
    }
  ]
}
```

---

## 5. Running the Test Suites

```bash
# In backend/
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts

# In ai-service/
cd ../ai-service
.venv\Scripts\pytest tests/test_face_api.py -v
```

---

## 6. Environment Variables (`.env`)

```env
NODE_ENV=development

BACKEND_PORT=5000
FRONTEND_URL=http://localhost:5173

AI_SERVICE_URL=http://localhost:8000

# Visual Search Configuration
SEARCH_PROVIDER=serpapi
SEARCH_API_KEY=
SEARCH_API_URL=https://serpapi.com/search.json
SEARCH_MAX_RESULTS=10
SEARCH_TIMEOUT_MS=15000

# Face Matching Configuration
MATCH_THRESHOLD=0.85
MAX_CONCURRENT_CANDIDATES=3
CANDIDATE_DOWNLOAD_TIMEOUT_MS=10000

SOLANA_NETWORK=devnet
SOLANA_RPC_URL=
SOLANA_PRIVATE_KEY=
```
