import { Transaction } from '@solana/web3.js';
import { SolanaService } from './solana.service';
import { MemoService } from './memo';
import { BLOCKCHAIN_CONFIG } from './blockchain.config';
import {
  BlockchainHealth,
  BlockchainRecord,
  StoreEvidenceHashInput
} from './blockchain.types';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class BlockchainService {
  private static idempotencyCache = new Map<string, BlockchainRecord>();

  /**
   * Performs blockchain health check and returns wallet readiness & balance.
   */
  public static async getHealth(): Promise<BlockchainHealth> {
    try {
      const connection = SolanaService.getConnection();
      const version = await connection.getVersion();
      const keypair = SolanaService.getKeypair();

      if (!keypair) {
        return {
          success: true,
          network: BLOCKCHAIN_CONFIG.NETWORK,
          connected: true,
          walletConfigured: false
        };
      }

      const balanceSol = await SolanaService.getBalance();

      return {
        success: true,
        network: BLOCKCHAIN_CONFIG.NETWORK,
        connected: !!version,
        walletConfigured: true,
        walletPublicKey: keypair.publicKey.toBase58(),
        balanceSol
      };
    } catch (err: any) {
      logger.error(`[BLOCKCHAIN] Health check failed: ${err.message}`);
      return {
        success: false,
        network: BLOCKCHAIN_CONFIG.NETWORK,
        connected: false,
        walletConfigured: false,
        error: err.message
      };
    }
  }

  /**
   * Stores evidence SHA-256 fingerprint on Solana Devnet using the SPL Memo program.
   */
  public static async storeEvidenceHash(input: StoreEvidenceHashInput): Promise<BlockchainRecord> {
    const { evidenceId, hash } = input;

    // 1. Validate inputs
    if (!evidenceId || typeof evidenceId !== 'string' || evidenceId.trim().length === 0) {
      throw new AppError(400, 'INVALID_EVIDENCE_ID', 'A valid evidenceId is required.');
    }

    if (!hash || typeof hash !== 'string' || hash.length !== 64 || !/^[0-9a-f]{64}$/i.test(hash)) {
      throw new AppError(400, 'INVALID_SHA256_HASH', 'Hash must be a valid 64-character hexadecimal SHA-256 string.');
    }

    const cleanHash = hash.toLowerCase();
    const cleanId = evidenceId.trim();

    // 2. Check Idempotency Cache
    const cacheKey = `${cleanId}:${cleanHash}`;
    const cached = this.idempotencyCache.get(cacheKey);
    if (cached) {
      logger.info(`[BLOCKCHAIN] Returning existing record for evidence ${cleanId} (cached signature: ${cached.transactionSignature})`);
      return cached;
    }

    // 3. Ensure wallet is configured
    const keypair = SolanaService.getKeypair();
    if (!keypair) {
      logger.error('[BLOCKCHAIN] Wallet private key is not configured.');
      throw new AppError(500, 'BLOCKCHAIN_WALLET_NOT_CONFIGURED', 'Solana wallet configuration is missing. Set SOLANA_PRIVATE_KEY in .env.');
    }

    // 4. Ensure wallet has funds (auto-request Devnet airdrop if 0)
    let balance = await SolanaService.getBalance();
    if (balance <= 0.001) {
      try {
        await SolanaService.requestAirdrop(1);
        balance = await SolanaService.getBalance();
      } catch (err: any) {
        logger.warn(`[BLOCKCHAIN] Devnet airdrop failed or rate limited: ${err.message}`);
      }

      if (balance <= 0.0005) {
        throw new AppError(400, 'BLOCKCHAIN_INSUFFICIENT_FUNDS', `Solana wallet ${keypair.publicKey.toBase58()} has insufficient Devnet SOL (${balance} SOL).`);
      }
    }

    // 5. Build Memo Instruction & Transaction
    logger.info(`[BLOCKCHAIN] Evidence ID: ${cleanId}`);
    logger.info(`[BLOCKCHAIN] SHA-256: ${cleanHash}`);

    const memoText = MemoService.buildMemoString(cleanId, cleanHash);
    const memoInstruction = MemoService.createMemoInstruction(memoText, keypair.publicKey);

    const transaction = new Transaction().add(memoInstruction);

    // 6. Sign, Send & Confirm
    try {
      const signature = await SolanaService.sendAndConfirmTransaction(transaction);
      const explorerUrl = `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/${signature}?cluster=devnet`;

      const record: BlockchainRecord = {
        network: 'devnet',
        transactionSignature: signature,
        evidenceId: cleanId,
        algorithm: 'SHA-256',
        hash: cleanHash,
        recordedAt: new Date().toISOString(),
        explorerUrl
      };

      this.idempotencyCache.set(cacheKey, record);
      logger.info(`[BLOCKCHAIN] Record successfully created: ${explorerUrl}`);
      return record;
    } catch (err: any) {
      logger.error(`[BLOCKCHAIN] Transaction failed: ${err.message}`);
      throw new AppError(500, 'BLOCKCHAIN_TRANSACTION_FAILED', `Failed to record evidence hash on Solana Devnet: ${err.message}`);
    }
  }
}
