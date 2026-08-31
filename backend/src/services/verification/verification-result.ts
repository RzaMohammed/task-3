import { BLOCKCHAIN_CONFIG } from '../blockchain/blockchain.config';
import { VerificationResponse, VerificationStatus } from './verification.types';
import { EvidenceRecord } from '../hashing/hashing.types';

export class VerificationResultFormatter {
  public static format(
    status: VerificationStatus,
    currentHash: string,
    blockchainHash: string,
    evidenceId: string,
    transactionSignature: string,
    evidence?: EvidenceRecord
  ): VerificationResponse {
    return {
      success: true,
      verified: status === 'VERIFIED',
      status,
      algorithm: 'SHA-256',
      currentHash,
      blockchainHash,
      evidenceId,
      transactionSignature,
      network: 'devnet',
      explorerUrl: `${BLOCKCHAIN_CONFIG.EXPLORER_BASE_URL}/${transactionSignature}?cluster=devnet`,
      details: evidence ? {
        matchSimilarity: evidence.matching.similarity,
        threshold: evidence.matching.threshold,
        platform: evidence.source.platform,
        url: evidence.source.url
      } : undefined
    };
  }
}
