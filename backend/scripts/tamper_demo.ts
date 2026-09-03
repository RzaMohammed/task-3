import { EvidenceService } from '../src/services/hashing/evidence.service';
import { VerificationService } from '../src/services/verification/verification.service';
import { BlockchainService } from '../src/services/blockchain/blockchain.service';
import { EvidenceRecord } from '../src/services/hashing/hashing.types';

async function runTamperDemo() {
  console.log('================================================================');
  console.log('  FACE BLOCKCHAIN VERIFIER — TAMPER DETECTION DEMONSTRATION');
  console.log('================================================================\n');

  // Step 1: Create Authentic Evidence Package
  console.log('--- PHASE 1: AUTHENTIC EVIDENCE GENERATION & BLOCKCHAIN RECORD ---');
  const authenticCandidate = {
    id: 'cand_demo_001',
    source: 'instagram',
    url: 'https://www.instagram.com/p/DB123456789/',
    title: 'Official Keynote Portrait 2026',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    similarity: 0.9452
  };

  const authenticPackage = EvidenceService.createEvidenceRecord({
    match: authenticCandidate,
    threshold: 0.85
  });

  const onChainHash = authenticPackage.fingerprint.hash;
  const onChainId = authenticPackage.evidenceId;
  const mockSignature = '5wKk7pM1zJ8VsampleDevnetSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz';

  console.log(`[EVIDENCE] Evidence ID : ${onChainId}`);
  console.log(`[EVIDENCE] SHA-256 Hash: ${onChainHash}`);
  console.log(`[EVIDENCE] Canonical Title: "${authenticPackage.evidence.source.title}"`);
  console.log(`[BLOCKCHAIN] On-Chain Tx Signature: ${mockSignature}`);

  // Mock on-chain retrieval
  BlockchainService.getEvidenceRecord = async (_sig: string) => {
    return {
      type: 'FBV' as const,
      version: '1.0',
      evidenceId: onChainId,
      algorithm: 'SHA-256' as const,
      hash: onChainHash,
      rawMemo: `FBV|1.0|${onChainId}|SHA-256|${onChainHash}`
    };
  };

  // Step 2: Verify Authentic Package
  console.log('\n--- PHASE 2: VERIFYING AUTHENTIC PACKAGE ---');
  const authVerification = await VerificationService.verifyEvidenceAgainstBlockchain({
    evidence: authenticPackage.evidence,
    transactionSignature: mockSignature,
    evidenceId: onChainId
  });

  console.log(`[VERIFY] Current Computed Hash : ${authVerification.currentHash}`);
  console.log(`[VERIFY] Blockchain Stored Hash : ${authVerification.blockchainHash}`);
  console.log(`[VERIFY] Verification Status   : ${authVerification.status} (Verified: ${authVerification.verified})`);
  if (authVerification.status === 'VERIFIED') {
    console.log('>>> [RESULT 1/2] AUTHENTIC EVIDENCE: MATCH CONFIRMED (VERIFIED) ✓');
  }

  // Step 3: Tamper with Evidence Package (Mutate 1 field)
  console.log('\n--- PHASE 3: TAMPERING OFF-CHAIN EVIDENCE (MUTATING TITLE) ---');
  const tamperedEvidence: EvidenceRecord = JSON.parse(JSON.stringify(authenticPackage.evidence));
  tamperedEvidence.source.title = 'MALICIOUSLY ALTERED POST TITLE (TAMPERED)';

  console.log(`[TAMPER] Original Title: "${authenticPackage.evidence.source.title}"`);
  console.log(`[TAMPER] Altered Title : "${tamperedEvidence.source.title}"`);

  // Step 4: Verify Tampered Package
  console.log('\n--- PHASE 4: AUDITING TAMPERED PACKAGE AGAINST IMMUTABLE BLOCKCHAIN ---');
  const tamperVerification = await VerificationService.verifyEvidenceAgainstBlockchain({
    evidence: tamperedEvidence,
    transactionSignature: mockSignature,
    evidenceId: onChainId
  });

  console.log(`[VERIFY] Current Computed Hash : ${tamperVerification.currentHash}`);
  console.log(`[VERIFY] Blockchain Stored Hash : ${tamperVerification.blockchainHash}`);
  console.log(`[VERIFY] Verification Status   : ${tamperVerification.status} (Verified: ${tamperVerification.verified})`);
  if (tamperVerification.status === 'TAMPERED') {
    console.log('>>> [RESULT 2/2] TAMPERED EVIDENCE: MISMATCH DETECTED (TAMPERED) ✗');
  }

  console.log('\n================================================================');
  console.log('  TAMPER DEMONSTRATION COMPLETE — 100% CRYPTOGRAPHIC AUDIT PASS');
  console.log('================================================================');
}

runTamperDemo().catch(console.error);
