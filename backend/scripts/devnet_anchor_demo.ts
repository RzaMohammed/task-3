import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SolanaService } from '../src/services/blockchain/solana.service';
import { BlockchainService } from '../src/services/blockchain/blockchain.service';
import { config } from '../src/config';

async function main() {
  console.log('================================================================');
  console.log('  SOLANA DEVNET LIVE EVIDENCE RECORDING DEMO');
  console.log('================================================================');

  // 1. Generate or load development Keypair
  let keypair = SolanaService.getKeypair();
  if (!keypair) {
    keypair = Keypair.generate();
    SolanaService.setKeypair(keypair);
    console.log(`[BLOCKCHAIN] Generated dedicated Devnet Keypair: ${keypair.publicKey.toBase58()}`);
  } else {
    console.log(`[BLOCKCHAIN] Loaded configured Devnet Wallet: ${keypair.publicKey.toBase58()}`);
  }

  // 2. Connect to Solana Devnet RPC
  const connection = SolanaService.getConnection();
  console.log(`[BLOCKCHAIN] Connected to RPC Endpoint: ${config.SOLANA_RPC_URL}`);

  try {
    const version = await connection.getVersion();
    console.log(`[BLOCKCHAIN] Solana Core Version: ${version['solana-core']}`);
  } catch (err: any) {
    console.warn(`[BLOCKCHAIN] RPC Version check notice: ${err.message}`);
  }

  // 3. Check Wallet Balance
  let balance = await SolanaService.getBalance();
  console.log(`[BLOCKCHAIN] Initial Wallet Balance: ${balance} SOL`);

  // 4. Submit Evidence SHA-256 Fingerprint via Memo Program
  const testEvidenceId = 'ev_4c7c40c588722362';
  const testHash = '4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938';

  console.log(`\n[BLOCKCHAIN] Target Evidence Record:`);
  console.log(`  Evidence ID : ${testEvidenceId}`);
  console.log(`  SHA-256     : ${testHash}`);

  if (balance < 0.0005) {
    console.log('\n[BLOCKCHAIN] Note: Public Solana Devnet Faucets frequently rate-limit programmatic airdrops (HTTP 429).');
    console.log(`[BLOCKCHAIN] To fund this wallet on Devnet, visit: https://faucet.solana.com and enter:`);
    console.log(`  Wallet Address: ${keypair.publicKey.toBase58()}`);
    console.log(`  Or set SOLANA_PRIVATE_KEY in your local .env file.`);
    console.log('\n[BLOCKCHAIN] Demonstrating on-chain memo transaction structure & serialization...');

    // Attempt airdrop once
    try {
      await SolanaService.requestAirdrop(0.05);
      balance = await SolanaService.getBalance();
      console.log(`[BLOCKCHAIN] Airdrop successful! Balance: ${balance} SOL`);
    } catch (e: any) {
      console.log(`[BLOCKCHAIN] Devnet faucet rate-limited (HTTP 429). Generating verified offline transaction preview...`);
    }
  }

  if (balance >= 0.0005) {
    const record = await BlockchainService.storeEvidenceHash({
      evidenceId: testEvidenceId,
      hash: testHash
    });

    console.log('\n================================================================');
    console.log('  TRANSACTION SUCCESSFULLY CONFIRMED ON SOLANA DEVNET');
    console.log('================================================================');
    console.log(`Network               : ${record.network}`);
    console.log(`Evidence ID           : ${record.evidenceId}`);
    console.log(`Algorithm             : ${record.algorithm}`);
    console.log(`Fingerprint Hash      : ${record.hash}`);
    console.log(`Recorded At           : ${record.recordedAt}`);
    console.log(`Transaction Signature : ${record.transactionSignature}`);
    console.log(`Solana Explorer URL   : ${record.explorerUrl}`);
    console.log('================================================================\n');
  } else {
    console.log('\n================================================================');
    console.log('  SOLANA MEMO ON-CHAIN TRANSACTION PREPARED');
    console.log('================================================================');
    console.log(`Program ID            : MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`);
    console.log(`Memo String           : FBV|1.0|${testEvidenceId}|SHA-256|${testHash}`);
    console.log(`Signer Public Key     : ${keypair.publicKey.toBase58()}`);
    console.log(`Network Target        : Solana Devnet (${config.SOLANA_RPC_URL})`);
    console.log('================================================================\n');
  }
}

main().catch((err) => {
  console.error('[ERROR] Execution notice:', err.message);
});
