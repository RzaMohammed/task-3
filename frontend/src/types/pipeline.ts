export type PipelineStageStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export type PipelineStatus =
  | 'VERIFIED'
  | 'TAMPERED'
  | 'NO_FACE_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'FACE_ANALYSIS_FAILED'
  | 'NO_SEARCH_RESULTS'
  | 'SEARCH_FAILED'
  | 'NO_CONFIDENT_MATCH'
  | 'EVIDENCE_CREATION_FAILED'
  | 'BLOCKCHAIN_RECORD_FAILED'
  | 'VERIFICATION_FAILED';

export interface PipelineStages {
  faceAnalysis: PipelineStageStatus;
  webSearch: PipelineStageStatus;
  matching: PipelineStageStatus;
  evidence: PipelineStageStatus;
  blockchain: PipelineStageStatus;
  verification: PipelineStageStatus;
}

export interface PipelineTiming {
  faceAnalysisMs: number;
  webSearchMs: number;
  matchingMs: number;
  evidenceMs: number;
  blockchainMs: number;
  verificationMs: number;
  totalMs: number;
}

export interface PipelineSuccessResponse {
  success: true;
  pipelineId: string;
  status: 'VERIFIED' | 'TAMPERED';
  pipeline: PipelineStages;
  face: {
    faceDetected: boolean;
    faceCount: number;
    bbox?: number[];
    detectionConfidence?: number;
  };
  match: {
    found: boolean;
    similarity: number;
    threshold: number;
  };
  source: {
    url: string;
    platform: string;
    title: string | null;
    imageUrl?: string | null;
  };
  evidence: {
    evidenceId: string;
    algorithm: 'SHA-256';
    hash: string;
  };
  blockchain: {
    network: 'devnet';
    transactionSignature: string;
    explorerUrl: string;
    recordedAt: string;
  };
  verification: {
    verified: boolean;
    currentHash: string;
    blockchainHash: string;
  };
  timing: PipelineTiming;
}

export interface PipelineFailureResponse {
  success: false;
  pipelineId?: string;
  status: PipelineStatus;
  failedStage?: keyof PipelineStages;
  message: string;
  details?: Record<string, unknown>;
  pipeline?: PipelineStages;
  timing?: Partial<PipelineTiming>;
}

export type PipelineResponse = PipelineSuccessResponse | PipelineFailureResponse;

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface MerkleProof {
  leaf: string;
  leafIndex: number;
  proof: MerkleProofStep[];
  root: string;
}

export interface EvidenceAnchorInfo {
  network: 'solana-devnet' | 'solana-mainnet' | 'ipfs';
  txSignature?: string;
  memo?: string;
  cid?: string;
  timestamp: string;
}

export interface EvidenceBundleManifest {
  bundleVersion: '1.0';
  bundleId: string;
  createdAt: string;
  evidenceId: string;
  evidenceFingerprint: string;
  merkleRoot: string;
  checksums: {
    evidenceSha256: string;
    merkleProofSha256: string;
  };
  anchors: EvidenceAnchorInfo[];
}

export interface EvidenceAuditBundle {
  manifest: EvidenceBundleManifest;
  evidence: any;
  merkleProof: MerkleProof;
  bundleChecksum: string;
}

export type PipelineEventType =
  | 'connected'
  | 'stage:replay'
  | 'stage:start'
  | 'stage:progress'
  | 'stage:complete'
  | 'stage:error'
  | 'pipeline:complete';

export interface StageEventPayload {
  pipelineId: string;
  stage: keyof PipelineStages;
  status: PipelineStageStatus;
  progressPercent?: number;
  message?: string;
  durationMs?: number;
  error?: string;
  timestamp: string;
}

export interface PipelineStreamEvent {
  event: string;
  data: any;
}
