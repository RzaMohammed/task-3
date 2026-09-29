# Architecture: Zero-Knowledge Attestation, Persistent Audit Trails & Resilience

This specification documents the enterprise cryptography, zero-knowledge verification, durable audit trail storage, and RPC connection pooling implemented in the Face Recognition Blockchain Verification Pipeline.

---

## 1. Cancelable Biometrics & BioHashing (ISO/IEC 24745)

### Overview
Biometric traits cannot be changed if compromised. **BioHashing** transforms continuous 512-dimensional facial embeddings into revocable, privacy-preserving bitstrings using user-specific seed keys.

### Mathematical Formulation
1. **Gram-Schmidt Orthonormalization**: Given seed token $S$, generate a set of deterministic orthogonal projection vectors $\{ \mathbf{u}_1, \mathbf{u}_2, \dots, \mathbf{u}_m \} \in \mathbb{R}^d$ such that:
   $$\mathbf{u}_i \cdot \mathbf{u}_j = \delta_{ij} = \begin{cases} 1 & \text{if } i = j \\ 0 & \text{if } i \neq j \end{cases}$$
2. **Projection & Quantization**: Project probe embedding $\mathbf{x} \in \mathbb{R}^d$ onto the basis:
   $$b_i = \begin{cases} 1 & \text{if } \mathbf{x} \cdot \mathbf{u}_i \ge \theta \\ 0 & \text{if } \mathbf{x} \cdot \mathbf{u}_i < \theta \end{cases}$$
3. **Revocability & Non-Invertibility**:
   - If token $S$ is compromised, the template is revoked by issuing new seed $S^\prime$.
   - Output hashes from $S$ and $S^\prime$ are statistically uncorrelated ($\text{Similarity} \approx 0.50$).

---

## 2. Zero-Knowledge Biometric Distance Attestation (NIZK Schnorr-Sigma)

### Overview
Proves that a confidential probe face embedding matches an enrolled facial identity within Euclidean distance $\epsilon \le \text{Threshold}$ **without ever revealing probe facial embeddings or exact distance coordinates**.

### Protocol Specification
* **Parameters**: RFC 3526 MODP-1536 group with safe prime $p = 2q + 1$, generator $g = 2$, independent generator $h$.
* **Distance Representation**: Scalar Euclidean distance scaled to basis points $D \in [0, 10000]$.
* **Pedersen Commitment**: $C = g^D \cdot h^r \pmod p$ with secret blinding $r \in_R \mathbb{Z}_q$.
* **Announcement**: Prover chooses $w, s \in_R \mathbb{Z}_q$ and computes $A = g^w \cdot h^s \pmod p$.
* **Fiat-Shamir Heuristic**: Non-interactive challenge $c = \text{SHA256}(\text{proofId} \parallel \text{anchorHash} \parallel C \parallel A \parallel \text{threshold} \parallel t)$.
* **Responses**: $z_1 = w + c \cdot D$, $z_2 = s + c \cdot r$.
* **Verification Equation**:
  $$g^{z_1} \cdot h^{z_2} \equiv A \cdot C^c \pmod p$$

---

## 3. Persistent Audit Storage Engine (Rolling JSONL)

### Architecture
* **`IAuditStorageAdapter`**: Abstract contract for audit persistence supporting asynchronous append, hash query, index query, and time-range filtering.
* **`MemoryAuditStorageAdapter`**: Ephemeral zero-overhead in-memory adapter for unit testing and local development.
* **`RollingFileAuditStorageAdapter`**: Production durable append-only JSONL storage engine with:
  - Configurable maximum file size and rolling retention (e.g. `audit-trail.jsonl`, `audit-trail.jsonl.1`, ...).
  - SHA-256 cryptographic chain validation (`verifyIntegrity()`) scanning for disk tampering or broken hash chains.

---

## 4. Multi-Endpoint Solana RPC Connection Pool

### Architecture
* **`SolanaRpcPool`**: Manages primary, secondary, and fallback RPC endpoints (e.g. Solana Devnet, Helius, QuickNode, Ankr).
* **Circuit Breaker Integration**: Monitors node health and failure counts. Tripped circuits are isolated during cooldown periods.
* **Automatic Failover**: Routes transactions to alternative endpoints upon HTTP 429 (rate limits) or network timeouts.

---

## 5. Token Bucket Rate Limiter with Progressive Penalty Backoff

### Architecture
* **Token Bucket Algorithm**: Smooths bursty traffic with continuous fractional token replenishment based on elapsed milliseconds.
* **Progressive Penalty Escalation**: Repeat violators face exponential cooldown penalties ($2^k \times$ wait duration).
* **Memory Pruning**: Automatically evicts stale client buckets to eliminate memory leaks.