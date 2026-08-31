import axios from 'axios';
import FormData from 'form-data';
import { config } from '../../config';
import { logger } from '../../utils/logger';

export interface CandidateFaceAnalysisResult {
  status: 'SUCCESS' | 'NO_FACE' | 'MULTIPLE_FACES' | 'INVALID_IMAGE' | 'ERROR';
  embedding: number[] | null;
  errorDetail?: string;
}

export class CandidateFilter {
  /**
   * Submits candidate image buffer to AI service (InsightFace buffalo_l) to extract 512-D face embedding.
   */
  public static async analyzeCandidateImage(imageBuffer: Buffer, filename: string = 'candidate.jpg'): Promise<CandidateFaceAnalysisResult> {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, {
        filename,
        contentType: 'image/jpeg'
      });

      const response = await axios.post(
        `${config.AI_SERVICE_URL}/api/face/analyze?include_embedding=true`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 15000
        }
      );

      const data = response.data;
      if (data.success && data.face_detected && Array.isArray(data.embedding)) {
        return {
          status: 'SUCCESS',
          embedding: data.embedding
        };
      }

      return {
        status: 'NO_FACE',
        embedding: null,
        errorDetail: 'No face detected in candidate image'
      };
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        const errCode = err.response.data.error.code;
        if (errCode === 'NO_FACE_DETECTED') {
          return { status: 'NO_FACE', embedding: null, errorDetail: 'Zero faces detected' };
        }
        if (errCode === 'MULTIPLE_FACES_DETECTED') {
          return { status: 'MULTIPLE_FACES', embedding: null, errorDetail: 'Multiple ambiguous faces detected' };
        }
        if (errCode === 'INVALID_IMAGE' || errCode === 'UNSUPPORTED_IMAGE_FORMAT') {
          return { status: 'INVALID_IMAGE', embedding: null, errorDetail: 'Invalid candidate image format' };
        }
      }

      logger.warn(`[MATCH] Candidate face analysis failed: ${err.message}`);
      return {
        status: 'ERROR',
        embedding: null,
        errorDetail: err.message
      };
    }
  }
}
