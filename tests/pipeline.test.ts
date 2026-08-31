const axios = require('axios');
import { PipelineService } from '../backend/src/services/pipeline/pipeline.service';
import { SearchService } from '../backend/src/services/search/search.service';
import { MatchingService } from '../backend/src/services/matching/matching.service';
import { BlockchainService } from '../backend/src/services/blockchain/blockchain.service';
import { VerificationService } from '../backend/src/services/verification/verification.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<any>;

describe('Module 8 — Full Pipeline Integration Test Suite', () => {
  const dummyBuffer = Buffer.from('fake_image_bytes_123');
  const dummyEmbedding = Array(512).fill(0.044);
  const mockSignature = '5wKk7pM1zJ8VsampleSignatureXYZ1234567890abcdefghijklmnopqrstuvwxyz';

  const mockFaceSuccess = {
    data: {
      success: true,
      face_detected: true,
      face_count: 1,
      selected_face: {
        face_id: 0,
        bbox: [100, 100, 200, 200],
        detection_confidence: 0.985
      },
      embedding_generated: true,
      embedding_dimension: 512,
      embedding: dummyEmbedding
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Test 1 — Full pipeline execution succeeds end-to-end with status "VERIFIED"', async () => {
    // 1. Mock Face Analysis
    mockedAxios.post.mockResolvedValueOnce(mockFaceSuccess);

    // 2. Mock Web Search
    jest.spyOn(SearchService, 'searchByImage').mockResolvedValueOnce({
      success: true,
      query_type: 'visual_image_search',
      result_count: 1,
      results: [
        {
          id: 'match-1',
          url: 'https://www.instagram.com/p/test1/',
          source: 'instagram',
          title: 'Official Photography Portrait',
          imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
          description: 'Official test archive',
          publishedAt: null,
          resultType: 'social_media',
          metadata: {}
        }
      ]
    });

    // 3. Mock Candidate Matching
    jest.spyOn(MatchingService, 'matchCandidates').mockResolvedValueOnce({
      success: true,
      match_found: true,
      reason: 'MATCH_FOUND',
      best_similarity: 0.9412,
      threshold: 0.85,
      candidates_processed: 1,
      candidates_with_faces: 1,
      candidates: [],
      best_match: {
        id: 'match-1',
        url: 'https://www.instagram.com/p/test1/',
        source: 'instagram',
        title: 'Official Photography Portrait',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        similarity: 0.9412,
        similarity_percentage: 94.12
      }
    });

    // 4. Mock Blockchain Upload
    jest.spyOn(BlockchainService, 'storeEvidenceHash').mockResolvedValueOnce({
      network: 'devnet',
      transactionSignature: mockSignature,
      evidenceId: 'ev_mock_evidence_1',
      algorithm: 'SHA-256',
      hash: '4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938',
      recordedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`
    });

    // 5. Mock Blockchain Verification
    jest.spyOn(VerificationService, 'verifyEvidenceAgainstBlockchain').mockResolvedValueOnce({
      success: true,
      verified: true,
      status: 'VERIFIED',
      algorithm: 'SHA-256',
      currentHash: '4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938',
      blockchainHash: '4c7c40c588722362b6fb26967e99ba96d989f4a79c825a758a14592740cc5938',
      evidenceId: 'ev_mock_evidence_1',
      transactionSignature: mockSignature,
      network: 'devnet',
      explorerUrl: `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`
    });

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.status).toBe('VERIFIED');
    expect(result.pipeline.faceAnalysis).toBe('COMPLETED');
    expect(result.pipeline.webSearch).toBe('COMPLETED');
    expect(result.pipeline.matching).toBe('COMPLETED');
    expect(result.pipeline.evidence).toBe('COMPLETED');
    expect(result.pipeline.blockchain).toBe('COMPLETED');
    expect(result.pipeline.verification).toBe('COMPLETED');
    if (result.success) {
      expect(result.match.found).toBe(true);
      expect(result.match.similarity).toBe(0.9412);
      expect(result.blockchain.transactionSignature).toBe(mockSignature);
      expect(result.verification.verified).toBe(true);
      expect(result.timing.totalMs).toBeGreaterThanOrEqual(0);
    }
  });

  test('Test 2 — Stops pipeline gracefully when NO_FACE_DETECTED', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          error: {
            code: 'NO_FACE_DETECTED',
            message: 'No face detected in the uploaded image.'
          }
        }
      }
    });

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.status).toBe('NO_FACE_DETECTED');
    if (!result.success) {
      expect(result.failedStage).toBe('faceAnalysis');
    }
    expect(result.pipeline.faceAnalysis).toBe('FAILED');
    expect(result.pipeline.webSearch).toBe('PENDING');
  });

  test('Test 3 — Stops pipeline gracefully when SEARCH_FAILED', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockFaceSuccess);

    jest.spyOn(SearchService, 'searchByImage').mockRejectedValueOnce(new Error('Search API timeout'));

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.status).toBe('SEARCH_FAILED');
    if (!result.success) {
      expect(result.failedStage).toBe('webSearch');
    }
    expect(result.pipeline.faceAnalysis).toBe('COMPLETED');
    expect(result.pipeline.webSearch).toBe('FAILED');
    expect(result.pipeline.matching).toBe('PENDING');
  });

  test('Test 4 — Stops pipeline and prevents blockchain upload when NO_CONFIDENT_MATCH', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockFaceSuccess);

    jest.spyOn(SearchService, 'searchByImage').mockResolvedValueOnce({
      success: true,
      query_type: 'visual_image_search',
      result_count: 1,
      results: [
        {
          id: 'match-1',
          url: 'https://test.com/1',
          source: 'web',
          title: 'Candidate',
          imageUrl: 'https://test.com/img.jpg',
          thumbnailUrl: 'https://test.com/img.jpg',
          description: 'Low match candidate',
          publishedAt: null,
          resultType: 'web_page',
          metadata: {}
        }
      ]
    });

    // Match candidate has only 0.65 similarity (below 0.85 threshold)
    jest.spyOn(MatchingService, 'matchCandidates').mockResolvedValueOnce({
      success: true,
      match_found: false,
      reason: 'NO_CONFIDENT_MATCH',
      best_similarity: 0.65,
      threshold: 0.85,
      candidates_processed: 1,
      candidates_with_faces: 1,
      candidates: [],
      best_match: {
        id: 'match-1',
        url: 'https://test.com/1',
        source: 'web',
        title: 'Candidate',
        imageUrl: 'https://test.com/img.jpg',
        similarity: 0.65,
        similarity_percentage: 65
      }
    });

    const storeSpy = jest.spyOn(BlockchainService, 'storeEvidenceHash');

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.status).toBe('NO_CONFIDENT_MATCH');
    if (!result.success) {
      expect(result.failedStage).toBe('matching');
    }
    expect(result.pipeline.matching).toBe('FAILED');
    expect(result.pipeline.evidence).toBe('PENDING');
    expect(result.pipeline.blockchain).toBe('PENDING');
    // Critical safety requirement: No blockchain upload attempted for unconfirmed matches
    expect(storeSpy).not.toHaveBeenCalled();
  });

  test('Test 5 — Stops pipeline gracefully when BLOCKCHAIN_RECORD_FAILED', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockFaceSuccess);

    jest.spyOn(SearchService, 'searchByImage').mockResolvedValueOnce({
      success: true,
      query_type: 'visual_image_search',
      result_count: 1,
      results: [
        {
          id: 'match-1',
          url: 'https://test.com/1',
          source: 'web',
          title: 'Candidate',
          imageUrl: 'https://test.com/img.jpg',
          thumbnailUrl: 'https://test.com/img.jpg',
          description: 'Candidate',
          publishedAt: null,
          resultType: 'web_page',
          metadata: {}
        }
      ]
    });

    jest.spyOn(MatchingService, 'matchCandidates').mockResolvedValueOnce({
      success: true,
      match_found: true,
      reason: 'MATCH_FOUND',
      best_similarity: 0.92,
      threshold: 0.85,
      candidates_processed: 1,
      candidates_with_faces: 1,
      candidates: [],
      best_match: {
        id: 'match-1',
        url: 'https://test.com/1',
        source: 'web',
        title: 'Candidate',
        imageUrl: 'https://test.com/img.jpg',
        similarity: 0.92,
        similarity_percentage: 92
      }
    });

    jest.spyOn(BlockchainService, 'storeEvidenceHash').mockRejectedValueOnce(
      new Error('Solana RPC Network Failure')
    );

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(false);
    expect(result.status).toBe('BLOCKCHAIN_RECORD_FAILED');
    if (!result.success) {
      expect(result.failedStage).toBe('blockchain');
    }
    expect(result.pipeline.blockchain).toBe('FAILED');
    expect(result.pipeline.verification).toBe('PENDING');
  });

  test('Test 6 — Completes pipeline and accurately flags TAMPERED status when hashes diverge', async () => {
    mockedAxios.post.mockResolvedValueOnce(mockFaceSuccess);

    jest.spyOn(SearchService, 'searchByImage').mockResolvedValueOnce({
      success: true,
      query_type: 'visual_image_search',
      result_count: 1,
      results: [
        {
          id: 'match-1',
          url: 'https://test.com/1',
          source: 'web',
          title: 'Candidate',
          imageUrl: 'https://test.com/img.jpg',
          thumbnailUrl: 'https://test.com/img.jpg',
          description: 'Candidate',
          publishedAt: null,
          resultType: 'web_page',
          metadata: {}
        }
      ]
    });

    jest.spyOn(MatchingService, 'matchCandidates').mockResolvedValueOnce({
      success: true,
      match_found: true,
      reason: 'MATCH_FOUND',
      best_similarity: 0.92,
      threshold: 0.85,
      candidates_processed: 1,
      candidates_with_faces: 1,
      candidates: [],
      best_match: {
        id: 'match-1',
        url: 'https://test.com/1',
        source: 'web',
        title: 'Candidate',
        imageUrl: 'https://test.com/img.jpg',
        similarity: 0.92,
        similarity_percentage: 92
      }
    });

    jest.spyOn(BlockchainService, 'storeEvidenceHash').mockResolvedValueOnce({
      network: 'devnet',
      transactionSignature: mockSignature,
      evidenceId: 'ev_mock_evidence_tamper',
      algorithm: 'SHA-256',
      hash: 'hash_original_11111111111111111111111111111111111111111111111111111111',
      recordedAt: new Date().toISOString(),
      explorerUrl: `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`
    });

    // Tampered verification simulation
    jest.spyOn(VerificationService, 'verifyEvidenceAgainstBlockchain').mockResolvedValueOnce({
      success: true,
      verified: false,
      status: 'TAMPERED',
      algorithm: 'SHA-256',
      currentHash: 'hash_tampered_22222222222222222222222222222222222222222222222222222222',
      blockchainHash: 'hash_original_11111111111111111111111111111111111111111111111111111111',
      evidenceId: 'ev_mock_evidence_tamper',
      transactionSignature: mockSignature,
      network: 'devnet',
      explorerUrl: `https://explorer.solana.com/tx/${mockSignature}?cluster=devnet`
    });

    const result = await PipelineService.runPipeline(dummyBuffer, 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.status).toBe('TAMPERED');
    if (result.success) {
      expect(result.verification.verified).toBe(false);
    }
  });
});
