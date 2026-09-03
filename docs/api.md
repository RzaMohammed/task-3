# API Reference Documentation

This document provides complete technical specifications for all REST endpoints across the **Face Identification & Blockchain Verification Pipeline**.

---

## Table of Contents
1. [System Health](#1-system-health)
2. [Stage 1: Face Analysis API](#2-stage-1-face-analysis-api)
3. [Stage 2: Visual Web Search API](#3-stage-2-visual-web-search-api)
4. [Stage 3: Candidate Face Matching API](#4-stage-3-candidate-face-matching-api)
5. [Stage 4: Evidence Packaging & SHA-256 API](#5-stage-4-evidence-packaging--sha-256-api)
6. [Stage 5: Solana Blockchain API](#6-stage-5-solana-blockchain-api)
7. [Stage 6: Blockchain Verification & Tamper Detection API](#7-stage-6-blockchain-verification--tamper-detection-api)
8. [Unified Pipeline Orchestration API](#8-unified-pipeline-orchestration-api)

---

## 1. System Health

### `GET /health` or `GET /api/health`
Checks operational readiness across Node.js backend, Python InsightFace AI service, and Solana Devnet RPC.

#### Response (`200 OK`):
```json
{
  "success": true,
  "service": "face-blockchain-verifier-backend",
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-09-01T09:00:00.000Z",
  "subsystems": {
    "aiService": "connected",
    "blockchainRpc": "connected"
  }
}
```

---

## 2. Stage 1: Face Analysis API

### `POST /api/face/analyze`
Accepts an image file, runs InsightFace detection, validates single face presence, and extracts a 512-D normalized vector.

* **URL**: `http://localhost:8000/api/face/analyze` (or via Node proxy)
* **Content-Type**: `multipart/form-data`
* **Query Parameters**: `include_embedding=true` (boolean, default: `false`)

#### Form Fields:
* `image`: Binary image file (JPEG, PNG, WebP — max 10MB).

#### Response (`200 OK`):
```json
{
  "success": true,
  "face_detected": true,
  "face_count": 1,
  "selected_face": {
    "face_id": 0,
    "bbox": [120, 80, 280, 240],
    "detection_confidence": 0.992
  },
  "embedding_generated": true,
  "embedding_dimension": 512,
  "embedding": [0.0412, -0.0189, "...512 floats..."]
}
```

#### Error Response (`400 Bad Request` — Multiple Faces):
```json
{
  "success": false,
  "error": {
    "code": "MULTIPLE_FACES_DETECTED",
    "message": "Multiple faces were detected (count: 3). Please upload an image containing exactly one face."
  }
}
```

---

## 3. Stage 2: Visual Web Search API

### `POST /api/search/image`
Submits an image to the genuine visual search provider (SerpApi Google Lens) and returns normalized candidate results from public social and web platforms.

* **Content-Type**: `multipart/form-data`

#### Form Fields:
* `image`: Binary image file.

#### Response (`200 OK`):
```json
{
  "success": true,
  "query_type": "visual_image_search",
  "result_count": 3,
  "results": [
    {
      "id": "cand_1",
      "url": "https://www.instagram.com/p/DB123456789/",
      "source": "instagram",
      "title": "Official Keynote Portrait 2026",
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "thumbnailUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "description": "Keynote portrait series",
      "publishedAt": "2026-05-12T10:00:00Z",
      "resultType": "social_media",
      "metadata": {}
    }
  ]
}
```

---

## 4. Stage 3: Candidate Face Matching API

### `POST /api/matching/run`
Downloads candidate images in-memory (with strict SSRF protection) and calculates cosine similarity against the source face embedding.

* **Content-Type**: `application/json`

#### Request Body:
```json
{
  "sourceEmbedding": [0.0412, -0.0189, "...512 floats..."],
  "candidates": [
    {
      "id": "cand_1",
      "url": "https://www.instagram.com/p/DB123456789/",
      "source": "instagram",
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "title": "Official Keynote Portrait"
    }
  ],
  "threshold": 0.85
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "match_found": true,
  "reason": "MATCH_FOUND",
  "best_similarity": 0.9452,
  "threshold": 0.85,
  "candidates_processed": 1,
  "candidates_with_faces": 1,
  "best_match": {
    "id": "cand_1",
    "url": "https://www.instagram.com/p/DB123456789/",
    "source": "instagram",
    "title": "Official Keynote Portrait",
    "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "similarity": 0.9452,
    "similarity_percentage": 94.52
  }
}
```

---

## 5. Stage 4: Evidence Packaging & SHA-256 API

### `POST /api/evidence/create`
Packages verified match metadata into a deterministic Canonical JSON structure (RFC 8785) and generates a SHA-256 fingerprint.

* **Content-Type**: `application/json`

#### Request Body:
```json
{
  "match": {
    "url": "https://www.instagram.com/p/DB123456789/",
    "source": "instagram",
    "title": "Official Keynote Portrait 2026",
    "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    "similarity": 0.9452
  },
  "threshold": 0.85
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "evidenceId": "ev_9012676074cfd563",
  "evidence": {
    "version": "1.0",
    "source": {
      "url": "https://www.instagram.com/p/DB123456789/",
      "platform": "instagram",
      "title": "Official Keynote Portrait 2026"
    },
    "content": {
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "description": null,
      "publishedAt": null
    },
    "matching": {
      "similarity": 0.9452,
      "threshold": 0.85
    },
    "metadata": {}
  },
  "fingerprint": {
    "algorithm": "SHA-256",
    "hash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a"
  }
}
```

---

## 6. Stage 5: Solana Blockchain API

### `POST /api/blockchain/record`
Broadcasts an SPL Memo transaction containing `FBV|1.0|<evidenceId>|SHA-256|<hash>` to Solana Devnet.

#### Request Body:
```json
{
  "evidenceId": "ev_9012676074cfd563",
  "algorithm": "SHA-256",
  "hash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a"
}
```

#### Response (`200 OK`):
```json
{
  "success": true,
  "network": "devnet",
  "transactionSignature": "5wKk7pM1zJ8VsampleDevnetSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz",
  "evidenceId": "ev_9012676074cfd563",
  "algorithm": "SHA-256",
  "hash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a",
  "recordedAt": "2026-09-01T09:15:00.000Z",
  "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet"
}
```

---

## 7. Stage 6: Blockchain Verification & Tamper Detection API

### `POST /api/verification/verify`
Reads the on-chain SPL Memo from Solana Devnet, independently recalculates the SHA-256 hash of the off-chain evidence, and returns `VERIFIED` or `TAMPERED`.

#### Request Body:
```json
{
  "transactionSignature": "5wKk7pM1zJ8VsampleDevnetSignatureXYZ...",
  "evidenceId": "ev_9012676074cfd563",
  "evidence": {
    "version": "1.0",
    "source": {
      "url": "https://www.instagram.com/p/DB123456789/",
      "platform": "instagram",
      "title": "Official Keynote Portrait 2026"
    },
    "content": {
      "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      "description": null,
      "publishedAt": null
    },
    "matching": {
      "similarity": 0.9452,
      "threshold": 0.85
    },
    "metadata": {}
  }
}
```

#### Response (`200 OK` — Verified):
```json
{
  "success": true,
  "verified": true,
  "status": "VERIFIED",
  "algorithm": "SHA-256",
  "currentHash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a",
  "blockchainHash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a",
  "evidenceId": "ev_9012676074cfd563",
  "transactionSignature": "5wKk7pM1zJ8VsampleDevnetSignatureXYZ...",
  "network": "devnet",
  "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet"
}
```

#### Response (`200 OK` — Tampered):
```json
{
  "success": true,
  "verified": false,
  "status": "TAMPERED",
  "algorithm": "SHA-256",
  "currentHash": "d3ce4cbafdb1739c3a44734e7384073a3906d9cb36996b8f700f9e8859451de6",
  "blockchainHash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a",
  "evidenceId": "ev_9012676074cfd563",
  "transactionSignature": "5wKk7pM1zJ8VsampleDevnetSignatureXYZ...",
  "network": "devnet",
  "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet"
}
```

---

## 8. Unified Pipeline Orchestration API

### `POST /api/pipeline/run`
Executes all 6 stages sequentially with timing metrics and unified error handling.

* **Content-Type**: `multipart/form-data`
* **Form Field**: `image` (binary file)

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "pipelineId": "pipe_9012676074cfd563",
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
    "bbox": [120, 80, 280, 240],
    "detectionConfidence": 0.992
  },
  "match": {
    "found": true,
    "similarity": 0.9452,
    "threshold": 0.85
  },
  "source": {
    "url": "https://www.instagram.com/p/DB123456789/",
    "platform": "instagram",
    "title": "Official Keynote Portrait 2026",
    "imageUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
  },
  "evidence": {
    "evidenceId": "ev_9012676074cfd563",
    "algorithm": "SHA-256",
    "hash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a"
  },
  "blockchain": {
    "network": "devnet",
    "transactionSignature": "5wKk7pM1zJ8VsampleDevnetSignatureXYZ...",
    "explorerUrl": "https://explorer.solana.com/tx/5wKk7pM1zJ8V...?cluster=devnet",
    "recordedAt": "2026-09-01T09:15:00.000Z"
  },
  "verification": {
    "verified": true,
    "currentHash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a",
    "blockchainHash": "9012676074cfd563a876ebc9d219676b2405fe1dd834a26de0f6c3aa6593116a"
  },
  "timing": {
    "faceAnalysisMs": 115,
    "webSearchMs": 340,
    "matchingMs": 390,
    "evidenceMs": 4,
    "blockchainMs": 820,
    "verificationMs": 310,
    "totalMs": 1979
  }
}
```
