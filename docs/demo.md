# Live Demo Walkthrough Guide

This guide walks you through executing the face verification and tampering detection pipeline in a 3-5 minute demo presentation.

---

## 1. Prerequisites for the Demo

1. Ensure the Python AI service, Node backend, and React frontend are all running.
2. Prepare a test face image. For example, download a public image of **Elon Musk** (e.g. [elon_test.jpg](https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society.jpg)).

---

## 2. Walkthrough Flow

### Step 1: Services Check
1. Open your browser to `http://localhost:5173`.
2. Observe the **System Service Status** card showing that:
   * Node.js Backend is **UP**
   * Python FastAPI AI Service is **UP**
   * Solana Devnet RPC Connection is **CONNECTED**
3. Take note of the **Active Solana Wallet PublicKey** being used to log transactions.

### Step 2: Running the Success Pipeline
1. Click **Launch Pipeline Workbench**.
2. Click **Upload Face Image** or drag & drop your prepared `elon_test.jpg` into the upload zone.
3. Observe the local image preview appearing instantly.
4. Click **Execute Verifier Pipeline**.
5. Watch the **Live Pipeline Trace** update sequentially:
   * **Step 1 (Face Analysis)**: Connects to FastAPI, processes the image via InsightFace, and reports `✓ Face detected` with `512-dimension vector`.
   * **Step 2 (Visual Web Search)**: Executes reverse image search and displays matches found.
   * **Step 3 (Candidate Matching)**: Downloads candidates, runs facial similarity comparisons using cosine similarity, and reports `✓ Best visual match confirmed! (Elon Musk - Wikipedia Profile)`.
   * **Step 4 (SHA-256 Hashing)**: Shows the canonical JSON SHA-256 signature generated.
   * **Step 5 (Solana Ledger)**: Assembles the transaction and prints the confirmation.
   * **Step 6 (On-Chain Verification)**: Pulls the transaction from Solana Devnet, verifies the hash matches, and prints `✓ DATA INTEGRITY VERIFIED`.
6. Look at the right panel showing the **✓ DATA INTEGRITY VERIFIED** green banner, matching ledger and computed hashes, transaction signature, and a click-through link to the **Solana Explorer** to view the transaction on-chain.

### Step 3: Simulating Data Tampering
1. Scroll down to the **Tamper Simulation Sandbox** card.
2. Modify the **Post Title** text-input box (e.g. change `"Elon Musk - Wikipedia Profile"` to `"Elon Musk - Edited Profile (Tampered)"`).
3. Click the **Re-verify Integrity** button.
4. The system immediately:
   * Recalculates the SHA-256 fingerprint on the modified JSON object.
   * Fetches the original hash from the Solana transaction memo.
   * Compares the values, detects the mismatch, and displays the crimson red **✗ TAMPERED / VERIFICATION FAILED** banner.
5. Review the hash mismatch comparison in the sandbox to complete the demo.
