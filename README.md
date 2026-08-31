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
* [ ] **Module 7**: Blockchain Verification & Tamper Detection Engine
* [ ] **Module 8**: Pipeline UI & Visual Verification Dashboard

---

## 2. Module 6 — Solana Devnet Blockchain Upload

Module 6 anchors the SHA-256 evidence fingerprint onto **Solana Devnet** using the official **Solana SPL Memo Program** (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`), creating an immutable public timestamp of the verification record.

### 2.1. Processing Architecture

```text
Evidence Package (Module 5)
       ↓
SHA-256 Fingerprint (64 Hex Characters)
       ↓
Compact Memo Payload Construction: FBV|1.0|<evidenceId>|SHA-256|<hash>
       ↓
Solana Web3.js Transaction Builder
       ↓
Solana Devnet Broadcast & Confirmation (commitment: 'confirmed')
       ↓
On-Chain Transaction Signature & Solana Explorer Verification URL
```

---

### 2.2. What Is Stored On-Chain?

* **No Biometrics On-Chain**: Raw image binaries and 512-D face embedding vectors are **never** published to the blockchain.
* **Compact Structured Memo**: Anchors an authoritative, lightweight string:
  ```text
  FBV|1.0|ev_4c7c40c588722362|SHA-256|4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938
  ```
  *(FBV = Face Blockchain Verification, version 1.0, Evidence ID, Algorithm, and 64-char Hash).*

---

### 2.3. Wallet Configuration & Devnet SOL

1. **Set Private Key**: Add your Solana Devnet private key (Base58 string or JSON array) to `.env`:
   ```env
   SOLANA_NETWORK=devnet
   SOLANA_RPC_URL=https://api.devnet.solana.com
   SOLANA_PRIVATE_KEY=your_base58_or_json_private_key_here
   ```
2. **Obtain Devnet SOL**: Visit [https://faucet.solana.com](https://faucet.solana.com) and paste your wallet's public key to receive test SOL.
3. **Check Wallet Balance**: Call `GET http://localhost:5000/api/blockchain/health`.

---

## 3. API Endpoints

### 3.1. Blockchain Health Check
```http
GET /api/blockchain/health
```
**Response (HTTP 200)**:
```json
{
  "success": true,
  "network": "devnet",
  "connected": true,
  "walletConfigured": true,
  "walletPublicKey": "GcMR7SikwuaLDLwBbvy3M3soajWvyHktN9rjCMDw3CFM",
  "balanceSol": 1.25
}
```

### 3.2. Record Evidence on Solana Devnet
```http
POST /api/blockchain/record
```
**Request**:
```json
{
  "evidenceId": "ev_4c7c40c588722362",
  "hash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938"
}
```
**Response (HTTP 200)**:
```json
{
  "success": true,
  "record": {
    "network": "devnet",
    "transactionSignature": "5wKk7pM1zJ8V...sampleSignature...",
    "evidenceId": "ev_4c7c40c588722362",
    "algorithm": "SHA-256",
    "hash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
    "recordedAt": "2026-08-31T17:35:00.000Z",
    "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...sampleSignature...?cluster=devnet"
  }
}
```

---

## 4. Running the Tests

```bash
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts ../tests/hashing.test.ts ../tests/blockchain.test.ts
```
