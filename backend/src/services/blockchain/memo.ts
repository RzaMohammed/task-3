import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BLOCKCHAIN_CONFIG } from './blockchain.config';

export class MemoService {
  /**
   * Constructs standard compact memo string: FBV|1.0|<evidenceId>|SHA-256|<hash>
   */
  public static buildMemoString(evidenceId: string, hash: string): string {
    return `${BLOCKCHAIN_CONFIG.MEMO_PREFIX}|${evidenceId}|SHA-256|${hash}`;
  }

  /**
   * Creates a Solana TransactionInstruction targeting the standard SPL Memo program.
   */
  public static createMemoInstruction(memoText: string, signerPublicKey: PublicKey): TransactionInstruction {
    return new TransactionInstruction({
      keys: [{ pubkey: signerPublicKey, isSigner: true, isWritable: true }],
      programId: new PublicKey(BLOCKCHAIN_CONFIG.MEMO_PROGRAM_ID),
      data: Buffer.from(memoText, 'utf-8')
    });
  }
}
