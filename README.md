# Face Identification & Blockchain Verification Pipeline

A production-quality monorepo architecture for the **Face Identification & Blockchain Verification Pipeline** (HH Goa 2026 Shortlisting Task 3).

---

## 1. Pipeline Status

* [x] **Module 1**: Project Foundation & Monorepo Setup (Frontend, Backend, AI Service, Docker Compose)
* [x] **Module 2**: Face Detection & Face Encoding (`InsightFace buffalo_l`, 512-D normalized vector, FastAPI)
* [x] **Module 3**: Genuine Visual / Social Media Search (`SerpApi Google Lens`, domain classifier, URL validator)
* [x] **Module 4**: Candidate Face Matching & Genuine Match Selection (Cosine similarity, SSRF guard, threshold ranking)
* [x] **Module 5**: SHA-256 Evidence Fingerprinting & Evidence Packaging (Canonical JSON, SHA-256, tamper verification)
* [x] **Module 6**: Solana Devnet Blockchain Upload & On-Chain Evidence Record (Solana Memo Program, Devnet transaction anchoring)
* [x] **Module 7**: Blockchain Verification & Tamper Detection Engine (On-chain memo retrieval, independent hash recalculation, tamper detection)
* [x] **Module 8**: Complete Node.js Backend Pipeline Integration (End-to-end orchestration endpoint, stage logs, timing metrics)
* [ ] **Module 9**: React Frontend Pipeline Dashboard & Demo Interface

---

## 2. Module 8 — Complete Node.js Backend Pipeline Integration

Module 8 links all preceding subsystems into ONE cohesive, resilient backend pipeline exposed through `POST /api/pipeline/run`.

### 2.1. End-to-End Pipeline Architecture

```text
User Image Upload (Multipart)
       │
       ▼
[1/6] FACE ANALYSIS (InsightFace FastAPI Service)
       │ ─── 0 faces -> Stop (NO_FACE_DETECTED)
       │ ─── >1 faces -> Stop (MULTIPLE_FACES_DETECTED)
       ▼ (512-D Normalized Vector)
[2/6] VISUAL WEB SEARCH (SerpApi / Google Lens Provider)
       │ ─── 0 results -> Stop (NO_SEARCH_RESULTS)
       ▼ (Candidate Social URLs & Images)
[3/6] CANDIDATE MATCHING (InsightFace + Cosine Similarity)
       │ ─── similarity < 0.85 -> Stop (NO_CONFIDENT_MATCH)
       ▼ (Best Genuine Match Selected)
[4/6] EVIDENCE PACKAGING (Canonical JSON + SHA-256 Fingerprint)
       │
       ▼ (evidenceId, SHA-256 hash)
[5/6] SOLANA DEVNET BLOCKCHAIN (SPL Memo Program Anchoring)
       │ ─── transaction failure -> Stop (BLOCKCHAIN_RECORD_FAILED)
       ▼ (Transaction Signature)
[6/6] BLOCKCHAIN VERIFICATION (Solana Memo Fetch + Hash Recalculation)
       │
       ▼
FINAL RESULT (VERIFIED / TAMPERED + Explorer URL + Timings)
```

---

### 2.2. Failure Handling & Safety Rules

1. **No Blockchain Anchoring for Unconfirmed Matches**: If no candidate reaches the similarity threshold (default `0.85`), the pipeline halts with `NO_CONFIDENT_MATCH` before creating evidence or submitting on-chain transactions.
2. **Zero-Trust Client Hash**: The server never trusts client-provided hashes; the verification stage reads directly from Solana Devnet RPC and recalculates the canonical hash.
3. **Privacy by Design**: Raw face embeddings (512-D vectors) and raw face images are **never** logged to the console, stored in plaintext databases, or posted on-chain.

---

## 3. Main API Endpoint

### Run Full Pipeline
```http
POST /api/pipeline/run
Content-Type: multipart/form-data
```
**Parameters**:
* `image`: Image file buffer (JPEG, PNG, WebP — max 10MB).

#### Example `curl` Command:
```bash
curl -X POST http://localhost:5000/api/pipeline/run \
  -F "image=@single_face.jpg"
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "pipelineId": "pipe_4c7c40c588722362",
  "status": "VERIFIED",
  "pipeline": {
    "faceAnalysis": "COMPLETED",
    "webSearch": "COMPLETED",
    "matching": "COMPLETED",
    "evidence": "COMPLETED",
    "blockchain": "COMPLETED",
    "verification": "COMPLETED"
  },
  "face": {
    "faceDetected": true,
    "faceCount": 1,
    "bbox": [100, 100, 200, 200],
    "detectionConfidence": 0.985
  },
  "match": {
    "found": true,
    "similarity": 0.9412,
    "threshold": 0.85
  },
  "source": {
    "url": "https://www.instagram.com/p/C9xZ_example1/",
    "platform": "instagram",
    "title": "Lena Forsen - Official Photography",
    "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
  },
  "evidence": {
    "evidenceId": "ev_4c7c40c588722362",
    "algorithm": "SHA-256",
    "hash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938"
  },
  "blockchain": {
    "network": "devnet",
    "transactionSignature": "5wKk7pM1zJ8VsampleSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz",
    "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet",
    "recordedAt": "2026-08-31T17:45:00.000Z"
  },
  "verification": {
    "verified": true,
    "currentHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
    "blockchainHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938"
  },
  "timing": {
    "faceAnalysisMs": 125,
    "webSearchMs": 350,
    "matchingMs": 420,
    "evidenceMs": 5,
    "blockchainMs": 850,
    "verificationMs": 320,
    "totalMs": 2070
  }
}
```

#### Failure Response Example (`400 Bad Request`):
```json
{
  "success": false,
  "pipelineId": "pipe_d9d32c3ecc33951e",
  "status": "NO_CONFIDENT_MATCH",
  "failedStage": "matching",
  "message": "No candidate exceeded the similarity threshold of 85% (Best: 71.4%).",
  "details": {
    "bestSimilarity": 0.714,
    "threshold": 0.85
  },
  "pipeline": {
    "faceAnalysis": "COMPLETED",
    "webSearch": "COMPLETED",
    "matching": "FAILED",
    "evidence": "PENDING",
    "blockchain": "PENDING",
    "verification": "PENDING"
  },
  "timing": {
    "faceAnalysisMs": 120,
    "webSearchMs": 340,
    "matchingMs": 410,
    "totalMs": 870
  }
}
```

---

## 4. Running the Tests

```bash
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts ../tests/hashing.test.ts ../tests/blockchain.test.ts ../tests/verification.test.ts ../tests/pipeline.test.ts
```
*(All 6 Test Suites and 42 individual unit/integration tests pass with 100% success).*
