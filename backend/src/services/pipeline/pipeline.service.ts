import crypto from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { config } from '../../config';
import { SearchService } from '../search/search.service';
import { MatchingService } from '../matching/matching.service';
import { EvidenceService } from '../hashing/evidence.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { VerificationService } from '../verification/verification.service';
import { PipelineLogger } from './pipeline.logger';
import { PipelineError } from './pipeline.errors';
import {
  PipelineResponse,
  PipelineStages,
  PipelineSuccessResponse,
  PipelineTiming
} from './pipeline.types';
import { logger } from '../../utils/logger';

export class PipelineService {
  /**
   * Executes the full Face Identification & Blockchain Verification Pipeline end-to-end.
   */
  public static async runPipeline(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
  ): Promise<PipelineResponse> {
    const pipelineId = `pipe_${crypto.randomBytes(8).toString('hex')}`;
    const startTime = Date.now();

    PipelineLogger.startPipeline(pipelineId);

    const stages: PipelineStages = {
      faceAnalysis: 'PENDING',
      webSearch: 'PENDING',
      matching: 'PENDING',
      evidence: 'PENDING',
      blockchain: 'PENDING',
      verification: 'PENDING'
    };

    const timing: PipelineTiming = {
      faceAnalysisMs: 0,
      webSearchMs: 0,
      matchingMs: 0,
      evidenceMs: 0,
      blockchainMs: 0,
      verificationMs: 0,
      totalMs: 0
    };

    try {
      // -----------------------------------------------------------------------
      // STAGE 1 — FACE ANALYSIS (InsightFace FastAPI Service)
      // -----------------------------------------------------------------------
      stages.faceAnalysis = 'PROCESSING';
      PipelineLogger.stageFaceAnalysis();
      const faceStart = Date.now();

      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename: 'input.jpg',
        contentType: mimeType
      });

      let faceRes: any;
      try {
        faceRes = await axios.post(
          `${config.AI_SERVICE_URL}/api/face/analyze?include_embedding=true`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: config.CANDIDATE_DOWNLOAD_TIMEOUT_MS || 15000
          }
        );
      } catch (err: any) {
        stages.faceAnalysis = 'FAILED';
        const errorData = err.response?.data?.error;
        const code = errorData?.code || 'FACE_ANALYSIS_FAILED';
        const message = errorData?.message || err.message || 'Face analysis service error.';

        if (code === 'NO_FACE_DETECTED') {
          PipelineLogger.fail('STAGE 1: FACE ANALYSIS', 'NO_FACE_DETECTED', message);
          throw new PipelineError(400, 'NO_FACE_DETECTED', 'faceAnalysis', message);
        }
        if (code === 'MULTIPLE_FACES_DETECTED') {
          PipelineLogger.fail('STAGE 1: FACE ANALYSIS', 'MULTIPLE_FACES_DETECTED', message);
          throw new PipelineError(400, 'MULTIPLE_FACES_DETECTED', 'faceAnalysis', message);
        }

        PipelineLogger.fail('STAGE 1: FACE ANALYSIS', 'FACE_ANALYSIS_FAILED', message);
        throw new PipelineError(502, 'FACE_ANALYSIS_FAILED', 'faceAnalysis', message);
      }

      const faceData = faceRes.data;
      if (!faceData || !faceData.face_detected || !faceData.embedding) {
        stages.faceAnalysis = 'FAILED';
        PipelineLogger.fail('STAGE 1: FACE ANALYSIS', 'NO_FACE_DETECTED', 'No face detected in input image.');
        throw new PipelineError(400, 'NO_FACE_DETECTED', 'faceAnalysis', 'No face detected in input image.');
      }

      const sourceEmbedding: number[] = faceData.embedding;
      const faceConfidence = faceData.selected_face?.detection_confidence || 0.99;
      const faceBbox = faceData.selected_face?.bbox || [0, 0, 0, 0];
      stages.faceAnalysis = 'COMPLETED';
      timing.faceAnalysisMs = Date.now() - faceStart;
      PipelineLogger.faceAnalysisSuccess(faceConfidence, faceBbox);

      // -----------------------------------------------------------------------
      // STAGE 2 — VISUAL WEB SEARCH (SerpApi / Provider)
      // -----------------------------------------------------------------------
      stages.webSearch = 'PROCESSING';
      PipelineLogger.stageWebSearch();
      const searchStart = Date.now();

      let candidates: any[] = [];
      try {
        const searchPayload = await SearchService.searchByImage({
          imageBuffer,
          mimeType,
          filename: 'input.jpg'
        });
        candidates = searchPayload.results || [];
      } catch (err: any) {
        stages.webSearch = 'FAILED';
        const msg = err.message || 'Visual web search failed.';
        PipelineLogger.fail('STAGE 2: WEB SEARCH', 'SEARCH_FAILED', msg);
        throw new PipelineError(502, 'SEARCH_FAILED', 'webSearch', msg);
      }

      if (!candidates || candidates.length === 0) {
        stages.webSearch = 'FAILED';
        PipelineLogger.fail('STAGE 2: WEB SEARCH', 'NO_SEARCH_RESULTS', 'No matching visual search results were found.');
        throw new PipelineError(404, 'NO_SEARCH_RESULTS', 'webSearch', 'No matching visual search results were found.');
      }

      stages.webSearch = 'COMPLETED';
      timing.webSearchMs = Date.now() - searchStart;
      PipelineLogger.webSearchSuccess(candidates.length);

      // -----------------------------------------------------------------------
      // STAGE 3 — CANDIDATE FACE MATCHING & COSINE SIMILARITY
      // -----------------------------------------------------------------------
      stages.matching = 'PROCESSING';
      PipelineLogger.stageMatching();
      const matchStart = Date.now();

      let matchResult: any;
      try {
        matchResult = await MatchingService.matchCandidates(
          sourceEmbedding,
          candidates
        );
      } catch (err: any) {
        stages.matching = 'FAILED';
        const msg = err.message || 'Candidate matching failed.';
        PipelineLogger.fail('STAGE 3: FACE MATCHING', 'NO_CONFIDENT_MATCH', msg);
        throw new PipelineError(500, 'NO_CONFIDENT_MATCH', 'matching', msg);
      }

      const bestCandidate = matchResult.best_match;
      if (!bestCandidate || bestCandidate.similarity < config.MATCH_THRESHOLD) {
        stages.matching = 'FAILED';
        const bestSim = bestCandidate?.similarity || 0;
        const msg = `No candidate exceeded the similarity threshold of ${(config.MATCH_THRESHOLD * 100).toFixed(0)}% (Best: ${(bestSim * 100).toFixed(1)}%).`;
        PipelineLogger.fail('STAGE 3: FACE MATCHING', 'NO_CONFIDENT_MATCH', msg);
        throw new PipelineError(400, 'NO_CONFIDENT_MATCH', 'matching', msg, {
          bestSimilarity: bestSim,
          threshold: config.MATCH_THRESHOLD
        });
      }

      stages.matching = 'COMPLETED';
      timing.matchingMs = Date.now() - matchStart;
      PipelineLogger.matchingSuccess(
        bestCandidate.similarity,
        config.MATCH_THRESHOLD,
        bestCandidate.source || 'web',
        bestCandidate.url
      );

      // -----------------------------------------------------------------------
      // STAGE 4 — EVIDENCE PACKAGING & DETERMINISTIC SHA-256 FINGERPRINTING
      // -----------------------------------------------------------------------
      stages.evidence = 'PROCESSING';
      PipelineLogger.stageEvidence();
      const evidenceStart = Date.now();

      const evidencePackage = EvidenceService.createEvidenceRecord({
        match: {
          url: bestCandidate.url,
          platform: bestCandidate.source || 'web',
          title: bestCandidate.title,
          description: null,
          imageUrl: bestCandidate.imageUrl,
          publishedAt: null,
          similarity: bestCandidate.similarity
        },
        threshold: config.MATCH_THRESHOLD
      });

      stages.evidence = 'COMPLETED';
      timing.evidenceMs = Date.now() - evidenceStart;
      PipelineLogger.evidenceSuccess(
        evidencePackage.evidenceId,
        evidencePackage.fingerprint.hash
      );

      // -----------------------------------------------------------------------
      // STAGE 5 — SOLANA DEVNET BLOCKCHAIN UPLOAD (SPL Memo Program)
      // -----------------------------------------------------------------------
      stages.blockchain = 'PROCESSING';
      PipelineLogger.stageBlockchain();
      const chainStart = Date.now();

      let blockchainRecord: any;
      try {
        blockchainRecord = await BlockchainService.storeEvidenceHash({
          evidenceId: evidencePackage.evidenceId,
          hash: evidencePackage.fingerprint.hash
        });
      } catch (err: any) {
        stages.blockchain = 'FAILED';
        const msg = err.message || 'Failed to submit transaction to Solana Devnet.';
        PipelineLogger.fail('STAGE 5: SOLANA DEVNET', 'BLOCKCHAIN_RECORD_FAILED', msg);
        throw new PipelineError(500, 'BLOCKCHAIN_RECORD_FAILED', 'blockchain', msg);
      }

      stages.blockchain = 'COMPLETED';
      timing.blockchainMs = Date.now() - chainStart;
      PipelineLogger.blockchainSuccess(
        blockchainRecord.transactionSignature,
        blockchainRecord.explorerUrl
      );

      // -----------------------------------------------------------------------
      // STAGE 6 — BLOCKCHAIN VERIFICATION & TAMPER DETECTION
      // -----------------------------------------------------------------------
      stages.verification = 'PROCESSING';
      PipelineLogger.stageVerification();
      const verifyStart = Date.now();

      const verificationResult = await VerificationService.verifyEvidenceAgainstBlockchain({
        transactionSignature: blockchainRecord.transactionSignature,
        evidenceId: evidencePackage.evidenceId,
        evidence: evidencePackage.evidence
      });

      stages.verification = 'COMPLETED';
      timing.verificationMs = Date.now() - verifyStart;
      timing.totalMs = Date.now() - startTime;

      PipelineLogger.verificationSuccess(
        verificationResult.status,
        verificationResult.currentHash,
        verificationResult.blockchainHash
      );

      PipelineLogger.complete(verificationResult.status, timing.totalMs);

      const response: PipelineSuccessResponse = {
        success: true,
        pipelineId,
        status: verificationResult.status,
        pipeline: stages,
        face: {
          faceDetected: true,
          faceCount: 1,
          bbox: faceBbox,
          detectionConfidence: faceConfidence
        },
        match: {
          found: true,
          similarity: bestCandidate.similarity,
          threshold: config.MATCH_THRESHOLD
        },
        source: {
          url: bestCandidate.url,
          platform: bestCandidate.source || 'web',
          title: bestCandidate.title,
          imageUrl: bestCandidate.imageUrl
        },
        evidence: {
          evidenceId: evidencePackage.evidenceId,
          algorithm: 'SHA-256',
          hash: evidencePackage.fingerprint.hash
        },
        blockchain: {
          network: 'devnet',
          transactionSignature: blockchainRecord.transactionSignature,
          explorerUrl: blockchainRecord.explorerUrl,
          recordedAt: blockchainRecord.recordedAt
        },
        verification: {
          verified: verificationResult.verified,
          currentHash: verificationResult.currentHash,
          blockchainHash: verificationResult.blockchainHash
        },
        timing
      };

      return response;
    } catch (err: any) {
      timing.totalMs = Date.now() - startTime;

      if (err instanceof PipelineError) {
        return {
          success: false,
          pipelineId,
          status: err.status,
          failedStage: err.failedStage,
          message: err.message,
          details: err.details,
          pipeline: stages,
          timing
        };
      }

      logger.error(`[PIPELINE] Unexpected failure: ${err.message}`);
      return {
        success: false,
        pipelineId,
        status: 'VERIFICATION_FAILED',
        failedStage: 'verification',
        message: err.message || 'An unexpected pipeline error occurred.',
        pipeline: stages,
        timing
      };
    }
  }
}
