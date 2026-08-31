import { SearchResult } from '../search/search.types';
import {
  CandidateMatchResult,
  MatchingInput,
  MatchingResponse,
  BestMatchSummary
} from './matching.types';
import { CandidateFetcher } from './candidate-fetcher';
import { CandidateFilter } from './candidate-filter';
import { calculateCosineSimilarity, formatSimilarityScore } from './similarity';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export class MatchingService {
  /**
   * Evaluates search candidates against the source face embedding.
   */
  public static async matchCandidates(
    sourceEmbedding: number[],
    searchResults: SearchResult[]
  ): Promise<MatchingResponse> {
    logger.info(`[MATCH] Processing ${searchResults.length} candidates (threshold: ${config.MATCH_THRESHOLD})`);

    if (!searchResults || searchResults.length === 0) {
      return {
        success: true,
        match_found: false,
        reason: 'NO_USABLE_CANDIDATES',
        threshold: config.MATCH_THRESHOLD,
        candidates_processed: 0,
        candidates_with_faces: 0,
        candidates: []
      };
    }

    const candidateResults: CandidateMatchResult[] = [];
    const concurrency = Math.max(1, config.MAX_CONCURRENT_CANDIDATES);

    // Process candidates in controlled concurrent batches
    for (let i = 0; i < searchResults.length; i += concurrency) {
      const batch = searchResults.slice(i, i + concurrency);
      const batchPromises = batch.map((item) => this.evaluateCandidate(sourceEmbedding, item));
      const batchResults = await Promise.all(batchPromises);
      candidateResults.push(...batchResults);
    }

    // Rank candidates by descending similarity
    candidateResults.sort((a, b) => (b.similarity ?? -1) - (a.similarity ?? -1));

    const candidatesWithFaces = candidateResults.filter(
      (c) => c.status === 'MATCHED' || c.status === 'BELOW_THRESHOLD'
    ).length;

    const topCandidate = candidateResults[0];
    const bestSim = topCandidate && topCandidate.similarity !== null ? topCandidate.similarity : null;

    if (topCandidate && bestSim !== null && bestSim >= config.MATCH_THRESHOLD) {
      const { similarity, similarity_percentage } = formatSimilarityScore(bestSim);
      logger.info(`[MATCH] Best candidate: ${topCandidate.id} (${topCandidate.source || topCandidate.url})`);
      logger.info(`[MATCH] Similarity: ${similarity} (${similarity_percentage}%)`);
      logger.info(`[MATCH] MATCH FOUND`);

      const bestMatch: BestMatchSummary = {
        id: topCandidate.id,
        url: topCandidate.url,
        title: topCandidate.title,
        source: topCandidate.source,
        imageUrl: topCandidate.imageUrl,
        similarity,
        similarity_percentage
      };

      return {
        success: true,
        match_found: true,
        reason: 'MATCH_FOUND',
        best_match: bestMatch,
        best_similarity: similarity,
        threshold: config.MATCH_THRESHOLD,
        candidates_processed: candidateResults.length,
        candidates_with_faces: candidatesWithFaces,
        candidates: candidateResults
      };
    }

    logger.info(`[MATCH] Best candidate similarity (${bestSim ?? 0}) is below threshold ${config.MATCH_THRESHOLD}`);
    logger.info(`[MATCH] NO CONFIDENT MATCH`);

    return {
      success: true,
      match_found: false,
      reason: 'NO_CONFIDENT_MATCH',
      best_similarity: bestSim !== null ? formatSimilarityScore(bestSim).similarity : null,
      threshold: config.MATCH_THRESHOLD,
      candidates_processed: candidateResults.length,
      candidates_with_faces: candidatesWithFaces,
      candidates: candidateResults
    };
  }

  /**
   * Processes a single search candidate.
   */
  private static async evaluateCandidate(
    sourceEmbedding: number[],
    candidate: SearchResult
  ): Promise<CandidateMatchResult> {
    const targetImageUrl = candidate.imageUrl || candidate.thumbnailUrl;

    if (!targetImageUrl) {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: null,
        resultType: candidate.resultType,
        status: 'IMAGE_DOWNLOAD_FAILED',
        similarity: null,
        similarity_percentage: null,
        errorDetail: 'No image URL provided for candidate'
      };
    }

    // 1. In-memory candidate image retrieval
    const imageBuffer = await CandidateFetcher.fetchImageBuffer(targetImageUrl);
    if (!imageBuffer) {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: targetImageUrl,
        resultType: candidate.resultType,
        status: 'IMAGE_DOWNLOAD_FAILED',
        similarity: null,
        similarity_percentage: null,
        errorDetail: 'Failed to download candidate image buffer or SSRF blocked'
      };
    }

    // 2. Candidate face detection & embedding extraction
    const analysis = await CandidateFilter.analyzeCandidateImage(imageBuffer, `${candidate.id}.jpg`);

    if (analysis.status === 'NO_FACE') {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: targetImageUrl,
        resultType: candidate.resultType,
        status: 'NO_FACE',
        similarity: null,
        similarity_percentage: null,
        errorDetail: analysis.errorDetail
      };
    }

    if (analysis.status === 'MULTIPLE_FACES') {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: targetImageUrl,
        resultType: candidate.resultType,
        status: 'MULTIPLE_FACES',
        similarity: null,
        similarity_percentage: null,
        errorDetail: analysis.errorDetail
      };
    }

    if (analysis.status === 'INVALID_IMAGE') {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: targetImageUrl,
        resultType: candidate.resultType,
        status: 'INVALID_IMAGE',
        similarity: null,
        similarity_percentage: null,
        errorDetail: analysis.errorDetail
      };
    }

    if (!analysis.embedding || analysis.embedding.length === 0) {
      return {
        id: candidate.id,
        url: candidate.url,
        title: candidate.title,
        source: candidate.source,
        imageUrl: targetImageUrl,
        resultType: candidate.resultType,
        status: 'NO_FACE',
        similarity: null,
        similarity_percentage: null,
        errorDetail: 'No embedding generated'
      };
    }

    // 3. Compute Cosine Similarity
    const rawSim = calculateCosineSimilarity(sourceEmbedding, analysis.embedding);
    const { similarity, similarity_percentage } = formatSimilarityScore(rawSim);

    const isMatch = similarity >= config.MATCH_THRESHOLD;
    logger.info(`[MATCH] Candidate ${candidate.id} (${candidate.source || candidate.url}) -> similarity: ${similarity}`);

    return {
      id: candidate.id,
      url: candidate.url,
      title: candidate.title,
      source: candidate.source,
      imageUrl: targetImageUrl,
      resultType: candidate.resultType,
      status: isMatch ? 'MATCHED' : 'BELOW_THRESHOLD',
      similarity,
      similarity_percentage
    };
  }
}
