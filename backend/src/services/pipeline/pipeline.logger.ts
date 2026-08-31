export class PipelineLogger {
  public static startPipeline(pipelineId: string): void {
    console.log('\n================================================================');
    console.log(`  FACE BLOCKCHAIN VERIFICATION PIPELINE [${pipelineId}]`);
    console.log('================================================================');
  }

  public static stageFaceAnalysis(): void {
    console.log('\n[1/6] FACE ANALYSIS');
    console.log('      Sending image to InsightFace AI service...');
  }

  public static faceAnalysisSuccess(confidence: number, bbox: number[]): void {
    console.log(`      ✓ Single face detected (confidence: ${(confidence * 100).toFixed(1)}%)`);
    console.log(`      ✓ Bounding box: [${bbox.join(', ')}]`);
    console.log('      ✓ 512-D Normalized face embedding generated');
  }

  public static stageWebSearch(): void {
    console.log('\n[2/6] WEB SEARCH');
    console.log('      Executing visual web & social media search...');
  }

  public static webSearchSuccess(count: number): void {
    console.log(`      ✓ Retrieved ${count} real candidate results from web/social sources`);
  }

  public static stageMatching(): void {
    console.log('\n[3/6] FACE MATCHING');
    console.log('      Downloading candidates & calculating cosine similarities...');
  }

  public static matchingSuccess(similarity: number, threshold: number, platform: string, url: string): void {
    console.log(`      ✓ Best Candidate Similarity: ${(similarity * 100).toFixed(2)}%`);
    console.log(`      ✓ Match Threshold          : ${(threshold * 100).toFixed(2)}%`);
    console.log(`      ✓ Platform Detected        : ${platform}`);
    console.log(`      ✓ Source URL               : ${url}`);
    console.log('      ✓ Match confirmed above threshold');
  }

  public static stageEvidence(): void {
    console.log('\n[4/6] EVIDENCE PACKAGING');
    console.log('      Normalizing & canonicalizing evidence package...');
  }

  public static evidenceSuccess(evidenceId: string, hash: string): void {
    console.log(`      ✓ Evidence ID   : ${evidenceId}`);
    console.log(`      ✓ SHA-256 Hash  : ${hash}`);
    console.log('      ✓ Deterministic fingerprint generated');
  }

  public static stageBlockchain(): void {
    console.log('\n[5/6] SOLANA DEVNET BLOCKCHAIN');
    console.log('      Broadcasting SPL Memo transaction to Solana Devnet...');
  }

  public static blockchainSuccess(signature: string, explorerUrl: string): void {
    console.log(`      ✓ Transaction Signature : ${signature}`);
    console.log(`      ✓ Solana Explorer URL   : ${explorerUrl}`);
    console.log('      ✓ Transaction confirmed on Solana Devnet');
  }

  public static stageVerification(): void {
    console.log('\n[6/6] BLOCKCHAIN VERIFICATION & TAMPER DETECTION');
    console.log('      Retrieving on-chain SPL Memo & recalculating SHA-256 hash...');
  }

  public static verificationSuccess(status: string, currentHash: string, onChainHash: string): void {
    console.log(`      ✓ Recalculated Hash : ${currentHash}`);
    console.log(`      ✓ Blockchain Hash   : ${onChainHash}`);
    console.log(`      ✓ Verification Result: ${status}`);
  }

  public static complete(status: string, durationMs: number): void {
    console.log('\n================================================================');
    if (status === 'VERIFIED') {
      console.log(`                       ✓ STATUS: VERIFIED                       `);
    } else {
      console.log(`                       ✗ STATUS: ${status}                      `);
    }
    console.log(`                  Total Duration: ${durationMs} ms               `);
    console.log('================================================================\n');
  }

  public static fail(stage: string, status: string, message: string): void {
    console.log('\n================================================================');
    console.log(`                     ✗ PIPELINE FAILED AT ${stage}              `);
    console.log(`                     Status : ${status}                         `);
    console.log(`                     Reason : ${message}                        `);
    console.log('================================================================\n');
  }
}
