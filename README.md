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
* [x] **Module 9**: React Frontend Pipeline Dashboard & Demo Interface (Cybersecurity dark UI, progress tracker, Solana Explorer link)
* [ ] **Module 10**: Final Integration Testing, GitHub README, Demo Preparation & Submission Checklist

---

## 2. Module 9 — React Frontend Pipeline Dashboard

Module 9 provides a cybersecurity-themed React + Vite dashboard for real-time visualization of the 6-stage pipeline.

### 2.1. Frontend Architecture

```text
frontend/src/
├── types/
│   └── pipeline.ts                  # TypeScript schemas matching backend payload
├── services/
│   └── api.ts                       # Axios client connected to VITE_API_BASE_URL
├── components/
│   ├── CopyButton.tsx               # Reusable clipboard copy button with tooltip feedback
│   ├── ImageUploader.tsx            # Drag & drop upload, thumbnail preview, file validator
│   ├── PipelineProgress.tsx         # 6-stage execution progress tracker with Lucide icons
│   ├── FaceAnalysisCard.tsx         # Face detection metrics card
│   ├── MatchCard.tsx                # Best candidate match with similarity score & safe external link
│   ├── EvidenceCard.tsx             # Canonical JSON SHA-256 fingerprint card with copy actions
│   ├── BlockchainCard.tsx           # Solana Devnet transaction card with live Explorer link
│   ├── VerificationCard.tsx         # VERIFIED vs. TAMPERED visual cryptographic comparison
│   ├── VerificationSummary.tsx      # High-level pipeline completion banner
│   └── ErrorState.tsx               # Failure state renderer with stage indicator & retry action
├── pages/
│   └── PipelinePage.tsx             # Master dashboard layout
├── App.tsx                          # Application router and navigation shell
└── index.css                        # Dark cybersecurity styling with Tailwind utilities
```

---

### 2.2. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### 2.3. Demo Flow

1. **Image Selection**: Drag and drop a face portrait image (JPG, PNG, WebP — max 10MB) into the dropzone.
2. **Launch Verification**: Click **`RUN VERIFICATION`** to trigger `POST /api/pipeline/run`.
3. **Watch Real-Time Stages**:
   * Stage 1: Face Analysis (InsightFace detection & embedding)
   * Stage 2: Web Search (Visual search across social platforms)
   * Stage 3: Face Matching (Cosine similarity comparison)
   * Stage 4: Evidence Packaging (Canonical JSON + SHA-256)
   * Stage 5: Solana Devnet Upload (SPL Memo on-chain record)
   * Stage 6: Blockchain Verification (Independent recalculation & audit)
4. **Audit Cryptographic Proof**: Inspect the computed hash, on-chain hash, and click **`VIEW ON SOLANA EXPLORER`** to inspect the live transaction on Solana Devnet.

---

## 3. Running All Tests

```bash
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts ../tests/hashing.test.ts ../tests/blockchain.test.ts ../tests/verification.test.ts ../tests/pipeline.test.ts
```
*(All 6 Test Suites and 42 individual unit/integration tests pass with 100% success).*
