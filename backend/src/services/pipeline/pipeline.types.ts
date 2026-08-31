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
  pipelineId: string;
  status: PipelineStatus;
  failedStage: keyof PipelineStages;
  message: string;
  details?: Record<string, unknown>;
  pipeline: PipelineStages;
  timing: Partial<PipelineTiming>;
}

export type PipelineResponse = PipelineSuccessResponse | PipelineFailureResponse;
