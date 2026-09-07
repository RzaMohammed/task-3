# End-to-End Architecture Flow

This document details the request flow and architectural interactions across all pipeline stages.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  actor User as Browser Client (React UI)
  participant Backend as Node.js / Express Backend
  participant AI as AI Face Service (InsightFace Buffalo_L)
  participant Search as Visual Search Provider (SerpAPI)
  participant Solana as Solana Devnet (SPL Memo v2)

  User->>Backend: POST /api/pipeline/run (multipart/form-data: image)
  Note over Backend: Validate MIME type & file size (<= 10MB)

  %% Stage 1: Face Detection
  Backend->>AI: POST /analyze-face (query image)
  AI-->>Backend: 512-d Embedding, Bounding Box, Landmarks, Gender, Age
  Note over Backend: Assert single face detected (reject if NO_FACE or MULTIPLE_FACES)

  %% Stage 2: Visual Search
  Backend->>Search: GET /search (visual reverse image query)
  Search-->>Backend: Top N Candidate Image URLs & Metadata

  %% Stage 3: Face Matching
  loop For each candidate image
    Backend->>AI: POST /extract-features (candidate image)
    AI-->>Backend: Candidate 512-d Embedding
    Backend->>Backend: Compute Cosine Similarity
  end
  Note over Backend: Check if best score >= 0.85 threshold

  %% Stage 4: Evidence Packaging
  Backend->>Backend: Canonicalize JSON (RFC 8785)
  Backend->>Backend: Compute SHA-256 Fingerprint

  %% Stage 5: Blockchain Anchoring
  Backend->>Solana: Send SPL Memo v2 Transaction (Memo: FACE_VERIFY:v1:ID:HASH:TS)
  Solana-->>Backend: Transaction Signature (tx_sig)

  %% Stage 6: Verification
  Backend->>Solana: getTransaction(tx_sig)
  Solana-->>Backend: Confirmed Block Data & Memo Content
  Backend->>Backend: Assert memo_hash == current_evidence_hash

  Backend-->>User: Complete Pipeline Success JSON Response
```

## Stage Responsibilities

| Stage | Service / Module | Key Output |
|---|---|---|
| **Stage 1: Face Analysis** | Python AI Service | 512-d Face Embedding |
| **Stage 2: Visual Search** | Search Service | Candidate URLs list |
| **Stage 3: Face Matching** | Matching Service | Match Result & Cosine Score |
| **Stage 4: Evidence Hashing** | Hashing Service | SHA-256 Canonical Fingerprint |
| **Stage 5: Blockchain Anchor** | Solana Web3 Service | Solana Transaction Signature |
| **Stage 6: Verification** | Verification Service | Cryptographic Audit Proof |
