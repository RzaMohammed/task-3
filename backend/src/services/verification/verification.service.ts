import { BlockchainService } from '../blockchain/blockchain.service';
import { HashingService } from '../hashing/hashing.service';
import { canonicalize } from '../hashing/canonical-json';
import { VerificationResultFormatter } from './verification-result';
import {
  VerifyEvidenceInput,
  VerificationResponse,
  VerificationStatus
} from './verification.types';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class VerificationService {
  /**
   * Verifies an off-chain EvidenceRecord against an on-chain Solana Devnet SPL Memo record.
   * 1. Fetches transaction from Solana Devnet.
   * 2. Extracts on-chain SHA-256 fingerprint from SPL Memo.
   * 3. Validates evidenceId association.
   * 4. Independently recalculates SHA-256 from current evidence via Canonical JSON.
   * 5. Compares current hash with on-chain hash (VERIFIED vs. TAMPERED).
   */
  public static async verifyEvidenceAgainstBlockchain(
    input: VerifyEvidenceInput
  ): Promise<VerificationResponse> {
    const { transactionSignature, evidenceId, evidence } = input;

    logger.info('[VERIFY] Verification requested');

    // 1. Validate inputs
    if (!transactionSignature || typeof transactionSignature !== 'string') {
      throw new AppError(400, 'INVALID_TRANSACTION_SIGNATURE', 'Transaction signature is required.');
    }

    if (!evidence || typeof evidence !== 'object') {
      throw new AppError(400, 'INVALID_EVIDENCE', 'Evidence record is required for verification.');
    }

    if (!evidence.source || !evidence.source.url) {
      throw new AppError(400, 'INVALID_EVIDENCE', 'Evidence record is missing source URL.');
    }

    logger.info(`[VERIFY] Transaction: ${transactionSignature.slice(0, 16)}...`);

    // 2. Fetch on-chain record from Solana Devnet
    const onChainRecord = await BlockchainService.getEvidenceRecord(transactionSignature);

    // 3. Prevent transaction confusion (Evidence ID match check)
    if (evidenceId && evidenceId.trim() !== onChainRecord.evidenceId) {
      logger.warn(
        `[VERIFY] Evidence ID mismatch: requested '${evidenceId}', on-chain record belongs to '${onChainRecord.evidenceId}'`
      );
      throw new AppError(
        400,
        'EVIDENCE_ID_MISMATCH',
        `Transaction evidence ID '${onChainRecord.evidenceId}' does not match requested evidence ID '${evidenceId}'.`
      );
    }

    // 4. Independently calculate current SHA-256 hash
    logger.info('[VERIFY] Recalculating SHA-256 from current evidence payload');
    let canonicalStr: string;
    try {
      canonicalStr = canonicalize(evidence);
    } catch (err: any) {
      throw new AppError(400, 'HASH_CALCULATION_FAILED', `Failed to canonicalize evidence: ${err.message}`);
    }

    const currentHash = HashingService.generateSHA256(canonicalStr);
    const blockchainHash = onChainRecord.hash.toLowerCase();

    logger.info(`[VERIFY] Current Hash    : ${currentHash}`);
    logger.info(`[VERIFY] Blockchain Hash : ${blockchainHash}`);

    // 5. Compare hashes
    const isMatch = currentHash.toLowerCase() === blockchainHash;
    const status: VerificationStatus = isMatch ? 'VERIFIED' : 'TAMPERED';

    if (isMatch) {
      logger.info(`[VERIFY] Cryptographic hash match confirmed -> VERIFIED`);
    } else {
      logger.warn(`[VERIFY] Cryptographic hash mismatch detected -> TAMPERED`);
    }

    return VerificationResultFormatter.format(
      status,
      currentHash,
      blockchainHash,
      onChainRecord.evidenceId,
      transactionSignature.trim(),
      evidence
    );
  }
}
