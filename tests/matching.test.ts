const request = require('supertest');
import app from '../backend/src/server';
import { MatchingService } from '../backend/src/services/matching/matching.service';
import { CandidateFetcher } from '../backend/src/services/matching/candidate-fetcher';
import { CandidateFilter } from '../backend/src/services/matching/candidate-filter';
import { calculateCosineSimilarity, formatSimilarityScore } from '../backend/src/services/matching/similarity';
import { SearchResult } from '../backend/src/services/search/search.types';

describe('Module 4 — Candidate Face Matching Test Suite', () => {
  // Helper to create a normalized 512-D vector
  const makeVector = (seed: number): number[] => {
    const vec = new Array(512).fill(0).map((_, i) => Math.sin(seed * (i + 1)));
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map((v) => v / norm);
  };

  const sampleSourceVector = makeVector(1);
  const identicalVector = makeVector(1);
  const differentVector = makeVector(42);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Test 1 — High similarity match (>= 0.85) yields MATCH_FOUND', async () => {
    // Mock CandidateFetcher to return dummy image buffer
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(Buffer.from('fake-image-bytes'));

    // Mock CandidateFilter to return an embedding nearly identical to source
    jest.spyOn(CandidateFilter, 'analyzeCandidateImage').mockResolvedValue({
      status: 'SUCCESS',
      embedding: identicalVector
    });

    const searchResults: SearchResult[] = [
      {
        id: 'match-1',
        title: 'Lena Public Portrait',
        url: 'https://www.instagram.com/p/sample1/',
        source: 'Instagram',
        imageUrl: 'https://images.unsplash.com/sample1.jpg',
        thumbnailUrl: 'https://images.unsplash.com/sample1.jpg',
        description: 'Portrait test photo',
        publishedAt: null,
        resultType: 'social_media',
        metadata: {}
      }
    ];

    const res = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(res.success).toBe(true);
    expect(res.match_found).toBe(true);
    expect(res.reason).toBe('MATCH_FOUND');
    expect(res.best_match).toBeDefined();
    expect(res.best_match?.id).toBe('match-1');
    expect(res.best_match?.similarity).toBeGreaterThanOrEqual(0.85);
    expect(res.best_match?.similarity_percentage).toBeGreaterThanOrEqual(85.0);
  });

  test('Test 2 — Low similarity match (< 0.85) yields NO_CONFIDENT_MATCH', async () => {
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(Buffer.from('fake-image-bytes'));

    jest.spyOn(CandidateFilter, 'analyzeCandidateImage').mockResolvedValue({
      status: 'SUCCESS',
      embedding: differentVector
    });

    const searchResults: SearchResult[] = [
      {
        id: 'match-2',
        title: 'Different Person Portrait',
        url: 'https://www.example.com/different-person',
        source: 'Web',
        imageUrl: 'https://images.unsplash.com/sample2.jpg',
        thumbnailUrl: 'https://images.unsplash.com/sample2.jpg',
        description: 'Different person',
        publishedAt: null,
        resultType: 'web_page',
        metadata: {}
      }
    ];

    const res = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(res.success).toBe(true);
    expect(res.match_found).toBe(false);
    expect(res.reason).toBe('NO_CONFIDENT_MATCH');
    expect(res.best_similarity).toBeLessThan(0.85);
  });

  test('Test 3 — Candidate with no face returns NO_FACE status', async () => {
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(Buffer.from('fake-image-bytes'));

    jest.spyOn(CandidateFilter, 'analyzeCandidateImage').mockResolvedValue({
      status: 'NO_FACE',
      embedding: null,
      errorDetail: 'No face detected in candidate image'
    });

    const searchResults: SearchResult[] = [
      {
        id: 'match-no-face',
        title: 'Landscape Photo',
        url: 'https://www.example.com/landscape',
        source: 'Web',
        imageUrl: 'https://images.unsplash.com/landscape.jpg',
        thumbnailUrl: 'https://images.unsplash.com/landscape.jpg',
        description: 'Nature landscape without faces',
        publishedAt: null,
        resultType: 'image',
        metadata: {}
      }
    ];

    const result = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(result.success).toBe(true);
    expect(result.match_found).toBe(false);
    expect(result.candidates?.[0].status).toBe('NO_FACE');
  });

  test('Test 4 — Candidate with multiple faces returns MULTIPLE_FACES status', async () => {
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(Buffer.from('fake-image-bytes'));

    jest.spyOn(CandidateFilter, 'analyzeCandidateImage').mockResolvedValue({
      status: 'MULTIPLE_FACES',
      embedding: null,
      errorDetail: 'Multiple ambiguous faces detected'
    });

    const searchResults: SearchResult[] = [
      {
        id: 'match-multi-face',
        title: 'Group Photo',
        url: 'https://www.example.com/group',
        source: 'Web',
        imageUrl: 'https://images.unsplash.com/group.jpg',
        thumbnailUrl: 'https://images.unsplash.com/group.jpg',
        description: 'Crowd / group image',
        publishedAt: null,
        resultType: 'web_page',
        metadata: {}
      }
    ];

    const result = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(result.success).toBe(true);
    expect(result.match_found).toBe(false);
    expect(result.candidates?.[0].status).toBe('MULTIPLE_FACES');
  });

  test('Test 5 — Invalid candidate image returns INVALID_IMAGE status', async () => {
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(Buffer.from('corrupt-bytes'));

    jest.spyOn(CandidateFilter, 'analyzeCandidateImage').mockResolvedValue({
      status: 'INVALID_IMAGE',
      embedding: null,
      errorDetail: 'Invalid candidate image format'
    });

    const searchResults: SearchResult[] = [
      {
        id: 'match-invalid',
        title: 'Corrupted File',
        url: 'https://www.example.com/corrupt',
        source: 'Web',
        imageUrl: 'https://images.unsplash.com/corrupt.png',
        thumbnailUrl: 'https://images.unsplash.com/corrupt.png',
        description: 'Corrupt file',
        publishedAt: null,
        resultType: 'image',
        metadata: {}
      }
    ];

    const result = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(result.success).toBe(true);
    expect(result.match_found).toBe(false);
    expect(result.candidates?.[0].status).toBe('INVALID_IMAGE');
  });

  test('Test 6 — Download failure returns IMAGE_DOWNLOAD_FAILED status', async () => {
    jest.spyOn(CandidateFetcher, 'fetchImageBuffer').mockResolvedValue(null);

    const searchResults: SearchResult[] = [
      {
        id: 'match-unreachable',
        title: 'Unreachable Host',
        url: 'https://www.unreachable-host-example.com/photo.jpg',
        source: 'Web',
        imageUrl: 'https://www.unreachable-host-example.com/photo.jpg',
        thumbnailUrl: null,
        description: 'Timed out host',
        publishedAt: null,
        resultType: 'image',
        metadata: {}
      }
    ];

    const result = await MatchingService.matchCandidates(sampleSourceVector, searchResults);

    expect(result.success).toBe(true);
    expect(result.match_found).toBe(false);
    expect(result.candidates?.[0].status).toBe('IMAGE_DOWNLOAD_FAILED');
  });

  test('Test 7 — Similarity Calculation unit tests', () => {
    // 1. Identical vector -> ~1.0
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    expect(calculateCosineSimilarity(v1, v2)).toBe(1.0);

    // 2. Orthogonal vector -> ~0.0
    const v3 = [0, 1, 0];
    expect(calculateCosineSimilarity(v1, v3)).toBe(0.0);

    // 3. Zero vector -> 0.0 (safe without zero division)
    const zeroVec = [0, 0, 0];
    expect(calculateCosineSimilarity(v1, zeroVec)).toBe(0.0);

    // 4. Dimension mismatch -> 0.0
    expect(calculateCosineSimilarity([1, 2], [1, 2, 3])).toBe(0.0);

    // 5. Score formatting
    const formatted = formatSimilarityScore(0.9543);
    expect(formatted.similarity).toBe(0.9543);
    expect(formatted.similarity_percentage).toBe(95.4);
  });

  test('Test 8 — SSRF Guard blocks private and local URLs', () => {
    expect(CandidateFetcher.isSafeUrl('http://localhost:8080/image.png')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('http://127.0.0.1/secret.jpg')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('http://192.168.1.1/admin.png')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('http://10.0.0.1/internal.jpg')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('http://169.254.169.254/latest/meta-data')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('file:///etc/passwd')).toBe(false);
    expect(CandidateFetcher.isSafeUrl('https://images.unsplash.com/photo-123.jpg')).toBe(true);
  });
});
