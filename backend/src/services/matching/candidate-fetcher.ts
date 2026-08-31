import axios from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/,
  /\.local$/i,
  /\.internal$/i
];

export class CandidateFetcher {
  /**
   * Validates target URL against SSRF rules.
   */
  public static isSafeUrl(rawUrl: string): boolean {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();
      for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Downloads candidate image buffer in-memory with strict timeout, size limits, and SSRF checks.
   */
  public static async fetchImageBuffer(imageUrl: string): Promise<Buffer | null> {
    if (!this.isSafeUrl(imageUrl)) {
      logger.warn(`[MATCH] Blocked unsafe or private candidate URL: ${imageUrl}`);
      return null;
    }

    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: config.CANDIDATE_DOWNLOAD_TIMEOUT_MS,
        maxContentLength: 10 * 1024 * 1024, // 10MB
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });

      const buffer = Buffer.from(response.data);
      if (!buffer || buffer.length === 0) {
        return null;
      }

      return buffer;
    } catch (err: any) {
      logger.warn(`[MATCH] Failed to download candidate image (${imageUrl}): ${err.message}`);
      return null;
    }
  }
}
