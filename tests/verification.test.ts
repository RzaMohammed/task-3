import { VerificationService } from '../backend/src/services/verification/verification.service';
import { BlockchainService } from '../backend/src/services/blockchain/blockchain.service';
import { BlockchainParser } from '../backend/src/services/blockchain/blockchain-parser';
import { EvidenceService } from '../backend/src/services/hashing/evidence.service';
import { EvidenceRecord } from '../backend/src/services/hashing/hashing.types';

describe('Module 7 — Blockchain Evidence Verification & Tamper Detection Test Suite', () => {
  const sampleMatch = {
    url: 'https://www.instagram.com/p/C9xZ_example1/',
    platform: 'instagram',
    title: 'Lena Forsen - Official Photography',
    description: 'Genuine public social media portrait archive.',
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
    publishedAt: null,
    similarity: 0.9412,
    metadata: {}
  };

  const evidencePackage = EvidenceService.createEvidenceRecord({
    match: sampleMatch,
    threshold: 0.85
  });

  const genuineEvidence: EvidenceRecord = evidencePackage.evidence;
  const genuineHash = evidencePackage.fingerprint.hash;
  const genuineEvidenceId = evidencePackage.evidenceId;
  const mockSignature = '5wKk7pM1zJ8VsampleSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Test 1 — Genuine evidence + matching on-chain record yields status "VERIFIED"', async () => {
    // Mock Solana Devnet retrieval returning matching on-chain memo record
    jest.spyOn(BlockchainService, 'getEvidenceRecord').mockResolvedValue({
      type: 'FBV',
      version: '1.0',
      evidenceId: genuineEvidenceId,
      algorithm: 'SHA-256',
      hash: genuineHash,
      rawMemo: `FBV|1.0|${genuineEvidenceId}|SHA-256|${genuineHash}`
    });

    const result = await VerificationService.verifyEvidenceAgainstBlockchain({
      transactionSignature: mockSignature,
      evidenceId: genuineEvidenceId,
      evidence: genuineEvidence
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.currentHash).toBe(genuineHash);
    expect(result.blockchainHash).toBe(genuineHash);
    expect(result.evidenceId).toBe(genuineEvidenceId);
    expect(result.explorerUrl).toContain(mockSignature);
  });

  test('Test 2 — Modified/tampered evidence yields status "TAMPERED" (verified: false)', async () => {
    jest.spyOn(BlockchainService, 'getEvidenceRecord').mockResolvedValue({
      type: 'FBV',
      version: '1.0',
      evidenceId: genuineEvidenceId,
      algorithm: 'SHA-256',
      hash: genuineHash,
      rawMemo: `FBV|1.0|${genuineEvidenceId}|SHA-256|${genuineHash}`
    });

    // Create tampered evidence copy
    const tamperedEvidence: EvidenceRecord = JSON.parse(JSON.stringify(genuineEvidence));
    tamperedEvidence.content.description = 'Malicious modified description text.';

    const result = await VerificationService.verifyEvidenceAgainstBlockchain({
      transactionSignature: mockSignature,
      evidenceId: genuineEvidenceId,
      evidence: tamperedEvidence
    });

    expect(result.success).toBe(true);
    expect(result.verified).toBe(false);
    expect(result.status).toBe('TAMPERED');
    expect(result.currentHash).not.toBe(genuineHash);
    expect(result.blockchainHash).toBe(genuineHash);
  });

  test('Test 3 — Non-existent transaction signature throws BLOCKCHAIN_RECORD_NOT_FOUND', async () => {
    jest.spyOn(BlockchainService, 'getEvidenceRecord').mockRejectedValue({
      statusCode: 404,
      code: 'BLOCKCHAIN_RECORD_NOT_FOUND',
      message: 'Transaction not found on Solana Devnet.'
    });

    await expect(
      VerificationService.verifyEvidenceAgainstBlockchain({
        transactionSignature: 'non_existent_signature',
        evidence: genuineEvidence
      })
    ).rejects.toMatchObject({
      code: 'BLOCKCHAIN_RECORD_NOT_FOUND'
    });
  });

  test('Test 4 — Transaction with malformed memo throws INVALID_BLOCKCHAIN_RECORD', () => {
    expect(() => {
      BlockchainParser.parseEvidenceMemo('INVALID|PAYLOAD|TEXT');
    }).toThrow('Invalid on-chain memo structure.');

    expect(() => {
      BlockchainParser.parseEvidenceMemo('UNKNOWN|1.0|ev_123|SHA-256|4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938');
    }).toThrow("Unrecognized memo type: 'UNKNOWN'. Expected 'FBV'.");
  });

  test('Test 5 — Evidence ID mismatch throws EVIDENCE_ID_MISMATCH', async () => {
    jest.spyOn(BlockchainService, 'getEvidenceRecord').mockResolvedValue({
      type: 'FBV',
      version: '1.0',
      evidenceId: 'ev_different_id_9999',
      algorithm: 'SHA-256',
      hash: genuineHash,
      rawMemo: `FBV|1.0|ev_different_id_9999|SHA-256|${genuineHash}`
    });

    await expect(
      VerificationService.verifyEvidenceAgainstBlockchain({
        transactionSignature: mockSignature,
        evidenceId: 'ev_requested_id_1111',
        evidence: genuineEvidence
      })
    ).rejects.toMatchObject({
      code: 'EVIDENCE_ID_MISMATCH'
    });
  });

  test('Test 6 — BlockchainParser correctly extracts all 5 fields from on-chain string', () => {
    const memo = `FBV|1.0|${genuineEvidenceId}|SHA-256|${genuineHash}`;
    const parsed = BlockchainParser.parseEvidenceMemo(memo);

    expect(parsed.type).toBe('FBV');
    expect(parsed.version).toBe('1.0');
    expect(parsed.evidenceId).toBe(genuineEvidenceId);
    expect(parsed.algorithm).toBe('SHA-256');
    expect(parsed.hash).toBe(genuineHash);
    expect(parsed.rawMemo).toBe(memo);
  });
});
