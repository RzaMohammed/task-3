import { PipelineResponse } from '../types/pipeline';

export interface SampleFacePreset {
  id: string;
  name: string;
  category: string;
  role: string;
  imageUrl: string;
  description: string;
  expectedResult: 'VERIFIED' | 'TAMPERED' | 'NO_CONFIDENT_MATCH' | 'NO_FACE_DETECTED';
}

export const SAMPLE_FACE_PRESETS: SampleFacePreset[] = [
  {
    id: 'sample-tech-exec',
    name: 'Tech Executive (Authentic)',
    category: 'Celebrity / Public',
    role: 'Keynote Speaker at Tech Summit',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    description: 'High-resolution frontal portrait. High similarity match on web with genuine provenance on Solana Devnet.',
    expectedResult: 'VERIFIED'
  },
  {
    id: 'sample-tampered-demo',
    name: 'Tamper Attack Case',
    category: 'Security Audit',
    role: 'Altered Metadata Simulation',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    description: 'Authentic candidate that was maliciously edited after blockchain anchoring. Demonstrates zero-trust detection.',
    expectedResult: 'TAMPERED'
  },
  {
    id: 'sample-low-similarity',
    name: 'Lookalike (Low Similarity)',
    category: 'Threshold Test',
    role: 'Distant Resemblance',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    description: 'Subject with superficial resemblance (68.2% similarity). Rejected by InsightFace threshold (≥ 85%).',
    expectedResult: 'NO_CONFIDENT_MATCH'
  },
  {
    id: 'sample-no-face',
    name: 'Landscape (No Face)',
    category: 'Validation Edge Case',
    role: 'Scenery / Abstract',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80',
    description: 'Scenic landscape without human faces. Demonstrates graceful early stage validation failure.',
    expectedResult: 'NO_FACE_DETECTED'
  }
];

export const DEMO_PRESET_RESPONSES: Record<string, PipelineResponse> = {
  VERIFIED: {
    success: true,
    pipelineId: 'pipe_demo_verified_9482',
    status: 'VERIFIED',
    pipeline: {
      faceAnalysis: 'COMPLETED',
      webSearch: 'COMPLETED',
      matching: 'COMPLETED',
      evidence: 'COMPLETED',
      blockchain: 'COMPLETED',
      verification: 'COMPLETED'
    },
    face: {
      faceDetected: true,
      faceCount: 1,
      bbox: [142, 98, 412, 386],
      detectionConfidence: 0.998
    },
    match: {
      found: true,
      similarity: 0.9482,
      threshold: 0.85
    },
    source: {
      url: 'https://twitter.com/elonmusk/status/1792837482910482912',
      platform: 'twitter',
      title: 'Keynote Address & AI Infrastructure Symposium 2026',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80'
    },
    evidence: {
      evidenceId: 'ev_e49b8a1c97f3d240',
      algorithm: 'SHA-256',
      hash: '3f8b89c629596395b00c3b8df25f0e6c5a3d76e4bc36242c7300c14c538a7c29'
    },
    blockchain: {
      network: 'devnet',
      transactionSignature: '5wKk7pM1zJ8VsampleDevnetSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz',
      explorerUrl: 'https://explorer.solana.com/tx/5wKk7pM1zJ8VsampleDevnetSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz?cluster=devnet',
      recordedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    verification: {
      verified: true,
      currentHash: '3f8b89c629596395b00c3b8df25f0e6c5a3d76e4bc36242c7300c14c538a7c29',
      blockchainHash: '3f8b89c629596395b00c3b8df25f0e6c5a3d76e4bc36242c7300c14c538a7c29'
    },
    timing: {
      faceAnalysisMs: 420,
      webSearchMs: 890,
      matchingMs: 310,
      evidenceMs: 85,
      blockchainMs: 1420,
      verificationMs: 45,
      totalMs: 3170
    }
  },
  TAMPERED: {
    success: true,
    pipelineId: 'pipe_demo_tampered_7819',
    status: 'TAMPERED',
    pipeline: {
      faceAnalysis: 'COMPLETED',
      webSearch: 'COMPLETED',
      matching: 'COMPLETED',
      evidence: 'COMPLETED',
      blockchain: 'COMPLETED',
      verification: 'COMPLETED'
    },
    face: {
      faceDetected: true,
      faceCount: 1,
      bbox: [110, 85, 395, 370],
      detectionConfidence: 0.994
    },
    match: {
      found: true,
      similarity: 0.9124,
      threshold: 0.85
    },
    source: {
      url: 'https://www.instagram.com/p/DB123456789/',
      platform: 'instagram',
      title: 'MALICIOUSLY ALTERED POST TITLE (TAMPERED)',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80'
    },
    evidence: {
      evidenceId: 'ev_a190ef7643b0c921',
      algorithm: 'SHA-256',
      hash: 'b5d19a28c34f9a76d1e03c4f5a6b89c7201948ba5391c0e35928a6f47b2c9183'
    },
    blockchain: {
      network: 'devnet',
      transactionSignature: '4zLp9qN2yK9WsampleDevnetSignatureABC9876543210zyxwvutsrqponmlkjihgfedcba',
      explorerUrl: 'https://explorer.solana.com/tx/4zLp9qN2yK9WsampleDevnetSignatureABC9876543210zyxwvutsrqponmlkjihgfedcba?cluster=devnet',
      recordedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    verification: {
      verified: false,
      currentHash: 'b5d19a28c34f9a76d1e03c4f5a6b89c7201948ba5391c0e35928a6f47b2c9183',
      blockchainHash: '7e2c91a03b54f89d146e29a8c7b019385491a0b3628e9104c82b47e51a9c3820'
    },
    timing: {
      faceAnalysisMs: 395,
      webSearchMs: 940,
      matchingMs: 295,
      evidenceMs: 90,
      blockchainMs: 1350,
      verificationMs: 50,
      totalMs: 3120
    }
  },
  NO_CONFIDENT_MATCH: {
    success: false,
    pipelineId: 'pipe_demo_lowsim_4190',
    status: 'NO_CONFIDENT_MATCH',
    failedStage: 'matching',
    message: 'Candidate face matches fell below the required cosine similarity threshold (68.2% < 85.0%).',
    details: {
      highestSimilarity: 0.682,
      threshold: 0.85,
      candidatesEvaluated: 12
    },
    pipeline: {
      faceAnalysis: 'COMPLETED',
      webSearch: 'COMPLETED',
      matching: 'FAILED',
      evidence: 'PENDING',
      blockchain: 'PENDING',
      verification: 'PENDING'
    },
    timing: {
      faceAnalysisMs: 410,
      webSearchMs: 880,
      matchingMs: 340,
      totalMs: 1630
    }
  },
  NO_FACE_DETECTED: {
    success: false,
    pipelineId: 'pipe_demo_noface_0019',
    status: 'NO_FACE_DETECTED',
    failedStage: 'faceAnalysis',
    message: 'InsightFace Buffalo_L detector found 0 human faces in the uploaded image.',
    details: {
      faceCount: 0,
      required: 1
    },
    pipeline: {
      faceAnalysis: 'FAILED',
      webSearch: 'PENDING',
      matching: 'PENDING',
      evidence: 'PENDING',
      blockchain: 'PENDING',
      verification: 'PENDING'
    },
    timing: {
      faceAnalysisMs: 215,
      totalMs: 215
    }
  }
};

/**
 * Deterministic canonical JSON stringification (RFC 8785)
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalizeJson(obj[key]);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Native browser SHA-256 hash calculator
 */
export async function calculateSha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
