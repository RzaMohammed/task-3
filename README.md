# Face Identification & Blockchain Verification Pipeline

A production-quality monorepo architecture for the **Face Identification & Blockchain Verification Pipeline** (HH Goa 2026 Shortlisting Task 3).

---

## 1. Pipeline Status

* [x] **Module 1**: Project Foundation & Monorepo Setup (Frontend, Backend, AI Service, Docker Compose)
* [x] **Module 2**: Face Detection & Face Encoding (`InsightFace buffalo_l`, 512-D normalized vector, FastAPI)
* [x] **Module 3**: Genuine Visual / Social Media Search (`SerpApi Google Lens`, domain classifier, URL validator)
* [x] **Module 4**: Candidate Face Matching & Genuine Match Selection (Cosine similarity, SSRF guard, threshold ranking)
* [x] **Module 5**: SHA-256 Evidence Fingerprinting & Evidence Packaging (Canonical JSON, SHA-256, tamper verification)
* [ ] **Module 6**: Solana Devnet Blockchain Storage
* [ ] **Module 7**: Blockchain Verification & Tamper Detection Engine
* [ ] **Module 8**: Pipeline UI & Visual Verification Dashboard

---

## 2. Module 5 — SHA-256 Evidence Fingerprinting & Evidence Packaging

Module 5 packages the verified post match into a deterministic evidence structure, serializes it with **Canonical JSON**, and computes a 64-character **SHA-256 fingerprint**.

### 2.1. Processing Architecture

```text
Best Matching Post (Module 4)
       ↓
Extract Evidence Record (No Unstable Fields)
       ↓
Canonical JSON Serialization (Recursive Key Sorting)
       ↓
Node.js Crypto SHA-256 Hashing
       ↓
Fingerprint (64 Hex Characters) + Evidence ID (ev_...)
       ↓
Tamper Verification Engine
```

---

### 2.2. Deterministic Canonical JSON

Standard `JSON.stringify` does not guarantee key ordering across platforms. The canonicalizer:
1. Sorts all object keys recursively in lexicographical order.
2. Preserves array element order.
3. Normalizes primitives (`strings`, `numbers`, `booleans`, `null`).
4. Strips `undefined` values and functions.
5. Produces compact, deterministic string representations.

Example Canonical String:
```json
{"content":{"description":"Genuine public social media portrait archive.","imageUrl":"https://...","publishedAt":null},"matching":{"similarity":0.9412,"threshold":0.85},"metadata":{},"source":{"platform":"instagram","title":"Lena Forsen - Official Photography","url":"https://..."},"version":"1.0"}
```

---

### 2.3. Evidence Schema (`version: "1.0"`)

```typescript
export interface EvidenceRecord {
  version: '1.0';
  source: {
    url: string;
    platform: string;
    title: string | null;
  };
  content: {
    description: string | null;
    imageUrl: string | null;
    publishedAt: string | null;
  };
  matching: {
    similarity: number;
    threshold: number;
  };
  metadata: Record<string, unknown>;
}
```

---

### 2.4. Deterministic Evidence ID

Generated directly from the first 16 characters of the SHA-256 hash:
$$\text{evidenceId} = \text{"ev\_"} + \text{hash}[0..16]$$
Example: `ev_4c7c40c588722362`

---

### 2.5. Tamper Detection Proof

Any modification to the evidence (e.g. changing the description, URL, or similarity score) alters the canonical JSON and produces a completely different SHA-256 hash:

```text
Original Evidence -> Hash A: 4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938
Tampered Evidence -> Hash B: e895fd8c3a3d9336263d5a1879fb05672edfee036b044ca33b06bb4dd17f39c6

Hash A != Hash B -> ✗ TAMPERING DETECTED (verified: false)
```

---

### 2.6. Privacy & Security

* **No Biometrics On-Chain**: Raw face embeddings and raw image binaries are **NOT** included in the evidence record.
* **No Unstable Fields**: Avoids runtime timestamps and random UUIDs so the same evidence produces the exact same hash reproducibility.

---

## 3. API Endpoints

### 3.1. Create Evidence & Fingerprint
```http
POST /api/evidence/create
```
**Request**:
```json
{
  "match": {
    "url": "https://www.instagram.com/p/C9xZ_example1/",
    "platform": "instagram",
    "title": "Lena Forsen - Official Photography",
    "description": "Genuine public social media portrait archive.",
    "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "publishedAt": null,
    "similarity": 0.9412,
    "metadata": {}
  },
  "threshold": 0.85
}
```
**Response**:
```json
{
  "success": true,
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
  },
  "fingerprint": {
    "algorithm": "SHA-256",
    "hash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
    "encoding": "hex"
  },
  "evidenceId": "ev_4c7c40c588722362"
}
```

### 3.2. Verify Evidence
```http
POST /api/evidence/verify
```
**Request**:
```json
{
  "evidence": { ... },
  "expectedHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938"
}
```
**Response**:
```json
{
  "success": true,
  "verified": true,
  "currentHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
  "expectedHash": "4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938",
  "algorithm": "SHA-256"
}
```

---

## 4. Running the Tests

```bash
cd backend
npx jest ../tests/search.test.ts ../tests/matching.test.ts ../tests/hashing.test.ts
```
