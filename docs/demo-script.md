# Hackathon Demo & Screen Recording Script

**Project**: Face Identification & Blockchain Verification Pipeline (Task 3)  
**Target Duration**: 3 – 5 minutes  
**Target Audience**: HH Goa 2026 Judges & Technical Reviewers  

---

## 1. Key Questions Answered in Demo

1. **Where did the image go?** $\rightarrow$ InsightFace AI service detects face and generates 512-D vector; SerpApi performs visual reverse image search.
2. **How did you choose the result?** $\rightarrow$ Candidates downloaded in-memory, face embeddings computed, cosine similarity calculated against threshold (85%).
3. **What went onto blockchain?** $\rightarrow$ SHA-256 fingerprint of Canonical JSON evidence package anchored via SPL Memo Program on Solana Devnet.
4. **How do you know it wasn't changed?** $\rightarrow$ Recalculate SHA-256 hash off-chain, fetch on-chain memo from Devnet, compare hashes ($\rightarrow$ `VERIFIED` or `TAMPERED`).

---

## 2. Step-by-Step Recording Sequence

### Step 1: System Overview & Setup (0:00 - 0:45)
* **Visual**: Show running terminals (AI service on `:8000`, Node backend on `:5000`, React frontend on `:5173`).
* **Narration**: 
  > *"Welcome to our Face Identification & Blockchain Verification Pipeline for Task 3. We built a full-stack monorepo featuring an InsightFace Python service, Node.js orchestrator, SerpApi visual search, SHA-256 evidence engine, Solana Devnet blockchain anchoring, and a dark-mode React dashboard."*

### Step 2: Upload Face Image & Run Pipeline (0:45 - 1:30)
* **Visual**: Open `http://localhost:5173`. Drag and drop the test face portrait into the dropzone. Point out the "Image ready ✓" indicator. Click **`RUN VERIFICATION`**.
* **Narration**:
  > *"We upload a face image. The system validates image size and format. When we click Run Verification, the pipeline executes 6 stages sequentially."*

### Step 3: Face Analysis & Visual Search (1:30 - 2:15)
* **Visual**: Show Stage 1 and Stage 2 progress. Focus on the Face Analysis Card (confidence, bounding box) and Match Card (Platform, Face Similarity Score, Discovered URL). Click the discovered URL opening the social source in a new tab.
* **Narration**:
  > *"Stage 1 uses InsightFace buffalo_l to extract a 512-D normalized embedding while safeguarding raw biometrics. Stage 2 queries SerpApi Google Lens for real web and social candidates. Stage 3 ranks candidate embeddings by cosine similarity, confirming a 94.5% match against our 85% threshold."*

### Step 4: Evidence Packaging & Solana Devnet Blockchain (2:15 - 3:00)
* **Visual**: Point to the Evidence Card (SHA-256 fingerprint, Evidence ID) and copy button. Point to the Blockchain Card (Devnet network, transaction signature) and click **`VIEW ON SOLANA EXPLORER`**. Show the transaction on `explorer.solana.com`.
* **Narration**:
  > *"Stage 4 normalizes the evidence into deterministic Canonical JSON (RFC 8785) and generates a SHA-256 fingerprint. Stage 5 broadcasts this fingerprint to Solana Devnet using the SPL Memo Program. We can click directly through to the Solana Explorer to view the immutable transaction on-chain."*

### Step 5: Cryptographic Verification (VERIFIED State) (3:00 - 3:30)
* **Visual**: Highlight the emerald `✓ VERIFIED` banner with side-by-side matching hashes.
* **Narration**:
  > *"Stage 6 queries Solana Devnet, extracts the on-chain memo hash, recalculates the current evidence hash independently, and confirms an exact match: VERIFIED."*

### Step 6: Tamper Detection Demonstration (TAMPERED State) (3:30 - 4:30)
* **Visual**: Run `npx ts-node scripts/tamper_demo.ts` in the terminal to show the simulated altered title and the resulting `✗ TAMPERED` status.
* **Narration**:
  > *"To prove zero-trust integrity, we simulate an attacker modifying a single metadata field (e.g. altering the post title). When we run verification again against the blockchain record, the recalculated hash diverges, and the engine immediately flags the evidence as TAMPERED."*

### Step 7: Wrap-up & Architecture Summary (4:30 - 5:00)
* **Visual**: Show root `README.md` and test suite execution (`42 passed`).
* **Narration**:
  > *"All 6 test suites pass with 100% test coverage. No raw biometric data is ever stored on-chain, and off-chain evidence integrity is mathematically guaranteed."*
