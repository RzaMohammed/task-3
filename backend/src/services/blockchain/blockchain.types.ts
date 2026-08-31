export interface BlockchainRecord {
  network: 'devnet';
  transactionSignature: string;
  evidenceId: string;
  algorithm: 'SHA-256';
  hash: string;
  recordedAt: string;
  explorerUrl: string;
}

export interface BlockchainHealth {
  success: boolean;
  network: string;
  connected: boolean;
  walletConfigured: boolean;
  walletPublicKey?: string;
  balanceSol?: number;
  error?: string;
}

export interface StoreEvidenceHashInput {
  evidenceId: string;
  hash: string;
}
