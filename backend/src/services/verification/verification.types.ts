import { EvidenceRecord } from '../hashing/hashing.types';

export type VerificationStatus = 'VERIFIED' | 'TAMPERED';

export interface VerifyEvidenceInput {
  transactionSignature: string;
  evidenceId?: string;
  evidence: EvidenceRecord;
}

export interface VerificationResponse {
  success: boolean;
  verified: boolean;
  status: VerificationStatus;
  algorithm: 'SHA-256';
  currentHash: string;
  blockchainHash: string;
  evidenceId: string;
  transactionSignature: string;
  network: 'devnet';
  explorerUrl: string;
  details?: {
    matchSimilarity: number;
    threshold: number;
    platform: string;
    url: string;
  };
}
