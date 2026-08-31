const { Keypair } = require('@solana/web3.js');
import { BlockchainService } from '../backend/src/services/blockchain/blockchain.service';
import { SolanaService } from '../backend/src/services/blockchain/solana.service';
import { MemoService } from '../backend/src/services/blockchain/memo';
import { BLOCKCHAIN_CONFIG } from '../backend/src/services/blockchain/blockchain.config';

describe('Module 6 — Solana Devnet Blockchain Upload Test Suite', () => {
  const sampleEvidenceId = 'ev_4c7c40c588722362';
  const sampleHash = '4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Test 1 — Memo string builder formats standard FBV payload correctly', () => {
    const memo = MemoService.buildMemoString(sampleEvidenceId, sampleHash);
    expect(memo).toBe(`FBV|1.0|${sampleEvidenceId}|SHA-256|${sampleHash}`);
    expect(memo.startsWith('FBV|1.0|')).toBe(true);
  });

  test('Test 2 — Memo instruction targets official SPL Memo Program ID', () => {
    const dummyKeypair = Keypair.generate();
    const memo = MemoService.buildMemoString(sampleEvidenceId, sampleHash);
    const instruction = MemoService.createMemoInstruction(memo, dummyKeypair.publicKey);

    expect(instruction.programId.toBase58()).toBe(BLOCKCHAIN_CONFIG.MEMO_PROGRAM_ID);
    expect(instruction.keys[0].pubkey.toBase58()).toBe(dummyKeypair.publicKey.toBase58());
    expect(instruction.keys[0].isSigner).toBe(true);
    expect(instruction.data.toString('utf-8')).toBe(memo);
  });

  test('Test 3 — Rejects invalid SHA-256 hash length with INVALID_SHA256_HASH', async () => {
    await expect(
      BlockchainService.storeEvidenceHash({
        evidenceId: sampleEvidenceId,
        hash: 'short_hash_123'
      })
    ).rejects.toThrow('Hash must be a valid 64-character hexadecimal SHA-256 string.');
  });

  test('Test 4 — Rejects invalid SHA-256 characters with INVALID_SHA256_HASH', async () => {
    const invalidCharHash = 'z'.repeat(64); // 'z' is not a valid hex character
    await expect(
      BlockchainService.storeEvidenceHash({
        evidenceId: sampleEvidenceId,
        hash: invalidCharHash
      })
    ).rejects.toThrow('Hash must be a valid 64-character hexadecimal SHA-256 string.');
  });

  test('Test 5 — Rejects empty evidenceId with INVALID_EVIDENCE_ID', async () => {
    await expect(
      BlockchainService.storeEvidenceHash({
        evidenceId: '',
        hash: sampleHash
      })
    ).rejects.toThrow('A valid evidenceId is required.');
  });

  test('Test 6 — Throws BLOCKCHAIN_WALLET_NOT_CONFIGURED if no private key is loaded', async () => {
    jest.spyOn(SolanaService, 'getKeypair').mockReturnValue(null);

    await expect(
      BlockchainService.storeEvidenceHash({
        evidenceId: 'ev_test_missing_wallet',
        hash: sampleHash
      })
    ).rejects.toThrow('Solana wallet configuration is missing.');
  });

  test('Test 7 — Idempotency cache returns existing record for duplicate hash without re-submitting', async () => {
    const dummyKeypair = Keypair.generate();
    jest.spyOn(SolanaService, 'getKeypair').mockReturnValue(dummyKeypair);
    jest.spyOn(SolanaService, 'getBalance').mockResolvedValue(1.5);
    const sendSpy = jest.spyOn(SolanaService, 'sendAndConfirmTransaction').mockResolvedValue('mock_tx_signature_123');

    // First call
    const record1 = await BlockchainService.storeEvidenceHash({
      evidenceId: 'ev_idempotency_test_1',
      hash: sampleHash
    });

    expect(record1.transactionSignature).toBe('mock_tx_signature_123');
    expect(sendSpy).toHaveBeenCalledTimes(1);

    // Second call with same evidenceId and hash
    const record2 = await BlockchainService.storeEvidenceHash({
      evidenceId: 'ev_idempotency_test_1',
      hash: sampleHash
    });

    expect(record2.transactionSignature).toBe('mock_tx_signature_123');
    // sendAndConfirmTransaction should not have been called a second time
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  test('Test 8 — Explorer URL contains correct Devnet cluster parameter', async () => {
    const dummyKeypair = Keypair.generate();
    jest.spyOn(SolanaService, 'getKeypair').mockReturnValue(dummyKeypair);
    jest.spyOn(SolanaService, 'getBalance').mockResolvedValue(1.0);
    jest.spyOn(SolanaService, 'sendAndConfirmTransaction').mockResolvedValue('test_signature_xyz');

    const record = await BlockchainService.storeEvidenceHash({
      evidenceId: 'ev_explorer_test',
      hash: sampleHash
    });

    expect(record.explorerUrl).toBe('https://explorer.solana.com/tx/test_signature_xyz?cluster=devnet');
  });
});
