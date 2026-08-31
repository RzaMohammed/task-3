import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Transaction
} from '@solana/web3.js';
import bs58 from 'bs58';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class SolanaService {
  private static connectionInstance: Connection | null = null;
  private static keypairInstance: Keypair | null = null;
  private static keypairLoaded: boolean = false;

  /**
   * Returns a singleton Connection to Solana Devnet RPC.
   */
  public static getConnection(): Connection {
    if (!this.connectionInstance) {
      this.connectionInstance = new Connection(config.SOLANA_RPC_URL, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: config.BLOCKCHAIN_TIMEOUT_MS
      });
    }
    return this.connectionInstance;
  }

  /**
   * Safely parses Keypair from environment variable SOLANA_PRIVATE_KEY (Base58 or JSON array).
   */
  public static getKeypair(): Keypair | null {
    if (this.keypairLoaded) {
      return this.keypairInstance;
    }

    this.keypairLoaded = true;
    const rawKey = config.SOLANA_PRIVATE_KEY ? config.SOLANA_PRIVATE_KEY.trim() : '';

    if (!rawKey) {
      return null;
    }

    try {
      if (rawKey.startsWith('[') && rawKey.endsWith(']')) {
        const parsed = JSON.parse(rawKey);
        const secret = Uint8Array.from(parsed);
        this.keypairInstance = Keypair.fromSecretKey(secret);
        return this.keypairInstance;
      }

      const decoded = bs58.decode(rawKey);
      this.keypairInstance = Keypair.fromSecretKey(decoded);
      return this.keypairInstance;
    } catch (err: any) {
      logger.error(`[BLOCKCHAIN] Failed to load Solana wallet from environment: ${err.message}`);
      return null;
    }
  }

  /**
   * Sets keypair programmatically (used for testing or dynamic Devnet keypair creation).
   */
  public static setKeypair(keypair: Keypair | null): void {
    this.keypairInstance = keypair;
    this.keypairLoaded = true;
  }

  /**
   * Queries SOL balance of the configured wallet.
   */
  public static async getBalance(): Promise<number> {
    const keypair = this.getKeypair();
    if (!keypair) {
      return 0;
    }

    const connection = this.getConnection();
    const lamports = await connection.getBalance(keypair.publicKey, 'confirmed');
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Requests a Devnet SOL airdrop for development testing.
   */
  public static async requestAirdrop(amountSol: number = 1): Promise<string> {
    const keypair = this.getKeypair();
    if (!keypair) {
      throw new Error('No wallet configured for airdrop');
    }

    logger.info(`[BLOCKCHAIN] Requesting ${amountSol} Devnet SOL airdrop for ${keypair.publicKey.toBase58()}...`);
    const connection = this.getConnection();
    const sig = await connection.requestAirdrop(keypair.publicKey, amountSol * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, 'confirmed');
    logger.info(`[BLOCKCHAIN] Devnet airdrop confirmed: ${sig}`);
    return sig;
  }

  /**
   * Signs, sends, and confirms a transaction on Solana Devnet.
   */
  public static async sendAndConfirmTransaction(transaction: Transaction): Promise<string> {
    const keypair = this.getKeypair();
    if (!keypair) {
      throw new Error('BLOCKCHAIN_WALLET_NOT_CONFIGURED');
    }

    const connection = this.getConnection();

    logger.info('[BLOCKCHAIN] Creating transaction');
    transaction.feePayer = keypair.publicKey;

    logger.info('[BLOCKCHAIN] Sending transaction');
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: 'confirmed'
    });

    logger.info(`[BLOCKCHAIN] Transaction submitted & confirmed: ${signature}`);
    return signature;
  }
}
