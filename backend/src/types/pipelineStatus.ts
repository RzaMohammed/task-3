/**
 * Strongly-typed definitions for pipeline lifecycle states,
 * execution stages, and telemetry events.
 */

export enum PipelineLifecycleState {
  IDLE = 'IDLE',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  TAMPERED = 'TAMPERED',
  FAILED = 'FAILED',
}

export enum PipelineStage {
  FACE_DETECTION = 'faceDetection',
  VISUAL_SEARCH = 'visualSearch',
  FACE_MATCHING = 'faceMatching',
  CANONICALIZATION = 'canonicalization',
  FINGERPRINTING = 'fingerprinting',
  BLOCKCHAIN_ANCHOR = 'blockchainAnchor',
  VERIFICATION = 'verification',
}

export interface StageTelemetryEvent {
  pipelineId: string;
  stage: PipelineStage;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progressPercent: number;
  message?: string;
  durationMs?: number;
  error?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PipelineExecutionMetrics {
  totalDurationMs: number;
  stageTimings: Partial<Record<PipelineStage, number>>;
  searchCandidatesEvaluated?: number;
  bestMatchSimilarity?: number;
  bytesProcessed?: number;
}

export interface PipelineAuditSummary {
  pipelineId: string;
  state: PipelineLifecycleState;
  sourceImageHash: string;
  evidenceFingerprint: string;
  merkleRoot?: string;
  solanaTxSignature?: string;
  ipfsCid?: string;
  isVerified: boolean;
  metrics: PipelineExecutionMetrics;
  createdAt: string;
  completedAt?: string;
}
