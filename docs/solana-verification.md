# Solana Devnet Blockchain Verification Guide

This document explains the cryptographic anchoring and immutable verification model used by the **Face Recognition Pipeline**.

## Architecture Overview

When a high-confidence face match is confirmed ($\ge 0.85$ cosine similarity), the pipeline generates an RFC 8785 canonical JSON evidence package and anchors its SHA-256 fingerprint onto Solana Devnet via the **SPL Memo Program v2**.

```
[Candidate Match] 
       │
       ▼
[RFC 8785 Canonical JSON] 
       │
       ▼
[SHA-256 Fingerprint: e3a5338...] 
       │
       ▼
[Solana Devnet Transaction (SPL Memo v2)] 
       │
       ▼
[Immutable Ledger Entry + Block Explorer Link]
```

## Memo Format Specification

The anchored memo string follows a compact colon-delimited format to optimize byte length within standard Solana transaction payload limits:

```
FACE_VERIFY:v1:<EVIDENCE_ID>:<SHA256_HASH>:<TIMESTAMP>
```

Example payload:
```
FACE_VERIFY:v1:ev_e3a5338722a056d5:e3a5338722a056d51c9b3121ae80c1e0e41127e494b48fa4297174b934c7000c:1725726000000
```

## How Verification Works

1. **Extraction**: The verification service queries the Solana transaction signature (`tx_signature`) via Solana Web3 JSON-RPC (`getTransaction`).
2. **Memo Parsing**: The Memo instruction is decoded, extracting the stored evidence ID and SHA-256 fingerprint.
3. **Canonical Re-hash**: The current evidence payload is converted to canonical JSON and hashed with SHA-256.
4. **Comparison**:
   - If `computed_hash === on_chain_hash`, the record is **AUTHENTIC & UNTAMPERED**.
   - If `computed_hash !== on_chain_hash`, the record has been **TAMPERED WITH**.

## Verifying on Solana Explorer

1. Obtain the transaction signature from the pipeline response or UI (`verification.txSignature`).
2. Open the Solana Explorer Devnet link:
   ```
   https://explorer.solana.com/tx/<YOUR_TX_SIGNATURE>?cluster=devnet
   ```
3. Inspect the **Instructions** table — find the `Memo (SPL Memo Program)` entry.
4. Compare the 64-character hex hash against the evidence package fingerprint.
