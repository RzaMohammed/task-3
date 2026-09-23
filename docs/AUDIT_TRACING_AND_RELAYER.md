# Cryptographic Audit Trails, Distributed Tracing & Solana Relayer Architecture

This document details the architectural specifications for the tamper-evident audit trail ledger, W3C distributed tracing infrastructure, subsidized Solana gas relayer, and biometric math utilities.

---

## 1. Cryptographic Chained Audit Trail

### Architectural Overview
The `AuditTrailService` provides an append-only, tamper-evident in-memory ledger recording security-critical events across the pipeline lifecycle:
- `EVIDENCE_PINNED`
- `EVIDENCE_VERIFIED`
- `BUNDLE_EXPORTED`
- `TAMPER_DETECTED`
- `MERKLE_ROOT_ANCHORED`
- `RELAYER_TRANSACTION`
- `SYSTEM_ALERT`

### Hash-Chaining Formula
Each audit entry links to the cryptographic digest of its immediate predecessor:
$$\text{EntryHash}_n = \text{SHA-256}(n : t : \text{eventType} : \text{actor} : \text{EntryHash}_{n-1} : \text{CanonicalJSON}(\text{payload}))$$

```
+-------------------+       +-------------------+       +-------------------+
|   Genesis (0)     |       |    Entry (1)      |       |    Entry (2)      |
| Prev: 0000...0000 | ----> | Prev: Hash(0)     | ----> | Prev: Hash(1)     |
| Hash: a89f...     |       | Hash: 4bc1...     |       | Hash: 9e32...     |
+-------------------+       +-------------------+       +-------------------+
```

### Forensic Integrity Verification
Calling `auditTrailService.verifyIntegrity()` traverses the ledger sequentially:
1. Validates the genesis block invariants (`index === 0`, `previousHash === 0000...0000`).
2. Checks continuous sequential ordering: `entry[i].index === entry[i-1].index + 1`.
3. Verifies hash pointer integrity: `entry[i].previousHash === entry[i-1].entryHash`.
4. Recomputes the SHA-256 digest over the canonicalized payload. If a payload or field was tampered, the exact corrupted sequence index is pinpointed.

---

## 2. Distributed Tracing (W3C TraceContext)

### Specification Compliance
Distributed tracing follows the official **W3C TraceContext Recommendation**:
- Format: `00-${traceId}-${spanId}-${traceFlags}`
- `traceId`: 32 lowercase hex characters (128-bit), non-zero.
- `spanId`: 16 lowercase hex characters (64-bit), non-zero.
- `traceFlags`: 2 hex characters (`01` = sampled, `00` = not sampled).

### Middleware Behavior (`tracingMiddleware`)
1. **Ingress**: Inspects `req.headers['traceparent']`.
2. **Context Propagation**:
   - If a valid parent `traceparent` is present, the middleware extracts the trace ID and generates a new child `spanId`.
   - If absent or malformed, it initializes a new root trace context.
3. **Egress**: Injects outgoing headers:
   - `traceparent`: Formatted W3C header.
   - `x-trace-id`: The 32-character root trace ID for frontend and log correlation.

---

## 3. Solana Gas Relayer & Fee Estimator

### Gas Subsidization Engine (`RelayerService`)
To eliminate blockchain onboarding friction, the relayer sponsors on-chain anchoring transactions:
- **Fee Payer**: Transactions are co-signed with the relayer's keypair as the fee payer.
- **Program Whitelisting**: Relayer only authorizes transactions invoking verified program IDs (e.g. SPL Memo Program `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).
- **Quota Safeguards**: Enforces configurable daily transaction allowances per client IP/wallet (default: 10 transactions / 24 hours).

### Dynamic Fee Estimator (`feeEstimator`)
Provides accurate gas calculation routines:
- **Base Network Fee**: 5,000 lamports per required signature.
- **Priority Micro-Lamports**: Supports dynamic compute budget tiers (`none`, `low`, `medium`, `high`, `extreme`).
- **Rent Exemption**: Calculates minimum rent-exempt balance for on-chain state storage accounts:
  $$\text{RentExemptLamports} = (\text{dataSizeBytes} + 128) \times 6960$$

---

## 4. Biometric Vector Mathematics (`vectorMath`)

Provides vector operations optimized for face embedding comparisons:
- **Cosine Similarity**:
  $$\text{CosineSimilarity}(\vec{u}, \vec{v}) = \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2}$$
- **Cosine Distance**: $1 - \text{CosineSimilarity}(\vec{u}, \vec{v})$.
- **Confidence Scoring**: Scales similarity into normalized $[0, 100]\%$ confidence with threshold classification.

---

## 5. Security Upload Engine & Forensics CLI

### Image Magic Byte Sniffer (`fileSanitizer`)
Validates image uploads using deep byte inspection:
- **JPEG**: `FF D8 FF`
- **PNG**: `89 50 4E 47 0D 0A 1A 0A`
- **WebP**: `52 49 46 46 ... 57 45 42 50`
- Blocks dangerous script extensions (`.exe`, `.sh`, `.php`, `.svg`) and path traversal sequences (`../`, null bytes).

### Forensic Evidence Diff Tool (`npm run bundle:diff`)
Compares two exported evidence bundles and generates a side-by-side discrepancy report:
```bash
node scripts/diff-bundles.js bundleA.json bundleB.json
```
Pinpoints modifications to manifest checksums, Merkle roots, IPFS CIDs, and canonical evidence claims with tamper likelihood severity ratings.
