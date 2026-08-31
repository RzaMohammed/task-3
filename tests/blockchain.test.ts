import { BlockchainService } from '../backend/src/services/blockchain/blockchain.service';
import { HashingService } from '../backend/src/services/hashing/hashing.service';

describe('BlockchainService Solana Devnet Tests', () => {
  const testPost = {
    title: 'Solana Devnet Test Entry',
    source: 'Automated Test Runner',
    url: 'https://test.example.org',
    description: 'This is a test block compiled by Jest runner.'
  };

  test('Store fingerprint hash, retrieve it, and execute verifyOnChain flow', async () => {
    // Generate deterministic hash signature
    const hash = HashingService.generateHash(testPost);

    // Write to Solana Devnet Memo
    console.log('Submitting memo transaction to Solana Devnet... (this takes several seconds)');
    const txId = await BlockchainService.storeHash(hash, testPost);
    expect(txId).toBeDefined();
    expect(typeof txId).toBe('string');
    console.log(`Memo successfully stored. Signature: ${txId}`);

    // Retrieve back from Solana Devnet using the Tx signature
    console.log('Fetching memo data from Solana Devnet transaction...');
    const record = await BlockchainService.getStoredHash(txId);
    expect(record.hash).toBe(hash);
    console.log('Retrieved recorded hash successfully matches local hash!');

    // Perform verification checks
    const successResult = await BlockchainService.verifyOnChain(testPost, txId);
    expect(successResult.verified).toBe(true);
    expect(successResult.status).toBe('VERIFIED');
    expect(successResult.blockchainHash).toBe(hash);

    // Simulate tampering and verify failure check
    const tamperedPost = {
      ...testPost,
      description: 'This description was altered after recording.'
    };
    const failResult = await BlockchainService.verifyOnChain(tamperedPost, txId);
    expect(failResult.verified).toBe(false);
    expect(failResult.status).toBe('TAMPERED');
    console.log('Tamper validation successful: verifyOnChain returned TAMPERED.');
  }, 45000); // 45 seconds timeout for blockchain confirmation latency
});
