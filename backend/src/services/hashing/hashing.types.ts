export interface EvidenceSource {
  url: string;
  platform: string;
  title: string | null;
}

export interface EvidenceContent {
  description: string | null;
  imageUrl: string | null;
  publishedAt: string | null;
}

export interface EvidenceMatching {
  similarity: number;
  threshold: number;
}

export interface EvidenceRecord {
  version: '1.0';
  source: EvidenceSource;
  content: EvidenceContent;
  matching: EvidenceMatching;
  metadata: Record<string, unknown>;
}

export interface FingerprintPayload {
  algorithm: 'SHA-256';
  hash: string;
  encoding: 'hex';
}

export interface EvidencePackage {
  success: boolean;
  evidence: EvidenceRecord;
  fingerprint: FingerprintPayload;
  evidenceId: string;
}

export interface VerificationResult {
  verified: boolean;
  currentHash: string;
  expectedHash: string;
  algorithm: 'SHA-256';
}

export interface CreateEvidenceInput {
  match: {
    url: string;
    platform?: string;
    source?: string;
    title?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    publishedAt?: string | null;
    similarity: number;
    metadata?: Record<string, unknown>;
  };
  threshold: number;
}
