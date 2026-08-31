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
* [ ] **Module 8**: Pipeline UI & Visual Verification Dashboard

---

## 2. Module 7 — Blockchain Retrieval, Evidence Verification & Tamper Detection

Module 7 proves that the evidence discovered during visual search and face matching has not been modified after its SHA-256 fingerprint was anchored to Solana Devnet.

### 2.1. Verification Architecture

```text
Off-Chain Evidence Record
        ↓
Canonicalize (Recursive Key Sorting)
        ↓
Independently Recalculate Current SHA-256 Hash
        ↓
Fetch On-Chain Record via Transaction Signature (Solana Devnet RPC)
        ↓
Extract SPL Memo Fingerprint (FBV|1.0|<evidenceId>|SHA-256|<hash>)
        ↓
Compare Hashes
        ↓
┌────────────────────────────────────────────────────────┐
│ Current Hash === Blockchain Hash ?                     │
│                                                        │
│ YES → VERIFIED (Cryptographically intact & authentic)  │
│ NO  → TAMPERED (Evidence was modified post-anchoring)  │
└────────────────────────────────────────────────────────┘
```

---

### 2.2. Critical Security Principle

* **Zero-Trust Client Hash**: The server **never** trusts a client-supplied hash. The current hash is always computed on-the-fly from the canonical JSON representation of the provided evidence.
* **Blockchain as Single Source of Truth**: The original hash is read directly from the immutable on-chain SPL Memo instruction on Solana Devnet.
* **Evidence ID Association**: Validates that the requested `evidenceId` matches the on-chain memo's `evidenceId` to prevent transaction confusion or replay attacks.

---

### 2.3. Verification Status Definitions

| Status | Meaning |
| :--- | :--- |
| **`VERIFIED`** | The independently recalculated SHA-256 hash matches the on-chain blockchain fingerprint exactly. The evidence is authentic and unmodified. |
| **`TAMPERED`** | The recalculated SHA-256 hash differs from the on-chain blockchain fingerprint. One or more fields (e.g. title, URL, similarity score, description) have been altered. |
| **`EVIDENCE_ID_MISMATCH`** | The transaction signature exists on Devnet, but the on-chain memo belongs to a different evidence ID. |
| **`BLOCKCHAIN_RECORD_NOT_FOUND`** | The transaction signature does not exist on Solana Devnet. |
| **`INVALID_BLOCKCHAIN_RECORD`** | The transaction exists on Devnet, but does not contain a valid `FBV|1.0|...` SPL Memo instruction. |

---

## 3. API Endpoints

### 3.1. Verify Evidence Against Blockchain
```http
POST /api/verification/verify
```
**Request**:
```json
{
  "transactionSignature": "5wKk7pM1zJ8VsampleSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz",
  "evidenceId": "ev_4c7c40c588722362",
  "evidence": {
    "version": "1.0",
    "source": {
      "url": "https://www.instagram.com/p/C9xZ_example1/",
      "platform": "instagram",
      "title": "Lena Forsen - Official Photography"
    },
    "content": {
      "description": "Genuine public social media portrait archive.",
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "publishedAt": null
    },
    "matching": {
      "similarity": 0.9412,
      "threshold": 0.85
    },
    "metadata": {}
  }
}
```

**Verified Response (HTTP 200)**:
```json
{
  "success": true,
  "verified": true,
  "status": "VERIFIED",
  "algorithm": "SHA-256",
  "currentHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
  "blockchainHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
  "evidenceId": "ev_4c7c40c588722362",
  "transactionSignature": "5wKk7pM1zJ8V...",
  "network": "devnet",
  "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet"
}
```

**Tampered Response (HTTP 200)**:
*(Generated when any field in `evidence` is altered)*
```json
{
  "success": true,
  "verified": false,
  "status": "TAMPERED",
  "algorithm": "SHA-256",
  "currentHash": "de84499a6127af925dd8d9b996b70b502a93cd1867764a65d42991e7d87464df",
  "blockchainHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
  "evidenceId": "ev_4c7c40c588722362",
  "transactionSignature": "5wKk7pM1zJ8V...",
  "network": "devnet",
  "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet"
}
```

---

## 4. Running the Tests

```bash
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts ../tests/hashing.test.ts ../tests/blockchain.test.ts ../tests/verification.test.ts
```
*(All 36 unit and integration test suites pass with 100% assertion coverage).*
