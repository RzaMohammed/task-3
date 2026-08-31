import axios from 'axios';
import FormData from 'form-data';
import { SearchProvider } from './base.provider';
import { SearchImageInput, RawSearchResult } from '../search.types';
import { config } from '../../../config';
import { logger } from '../../../utils/logger';
import {
  SearchAuthError,
  SearchRateLimitError,
  SearchTimeoutError,
  SearchUnavailableError,
  NoSearchResultsError
} from '../../../utils/errors';

export class SerpApiVisualSearchProvider implements SearchProvider {
  public readonly name = 'serpapi';

  public async searchByImage(input: SearchImageInput): Promise<RawSearchResult[]> {
    if (!config.SEARCH_API_KEY) {
      logger.warn('[SEARCH] SerpApi API key is not configured in environment.');
      throw new SearchAuthError('SerpApi API key (SEARCH_API_KEY) is missing in server environment.');
    }

    logger.info(`[SEARCH] Provider: ${this.name} (Google Lens engine)`);
    logger.info('[SEARCH] Sending image to visual search provider');

    try {
      const formData = new FormData();
      formData.append('engine', 'google_lens');
      formData.append('api_key', config.SEARCH_API_KEY);
      formData.append('file', input.imageBuffer, {
        filename: input.filename || 'image.jpg',
        contentType: input.mimeType || 'image/jpeg'
      });

      const response = await axios.post(config.SEARCH_API_URL, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: config.SEARCH_TIMEOUT_MS
      });

      const data = response.data;
      const rawResults: RawSearchResult[] = [];

      // Extract visual matches from SerpApi Google Lens response
      if (Array.isArray(data.visual_matches)) {
        for (const match of data.visual_matches) {
          if (match.link) {
            rawResults.push({
              title: match.title || null,
              link: match.link,
              source: match.source || null,
              thumbnail: match.thumbnail || null,
              imageUrl: match.original || match.thumbnail || null,
              snippet: match.snippet || null,
              rawMetadata: {
                position: match.position,
                price: match.price
              }
            });
          }
        }
      }

      // Check knowledge graph or reverse image matches
      if (Array.isArray(data.knowledge_graph)) {
        for (const kg of data.knowledge_graph) {
          if (kg.link) {
            rawResults.push({
              title: kg.title || null,
              link: kg.link,
              source: kg.source || null,
              thumbnail: kg.thumbnail || null,
              imageUrl: kg.thumbnail || null,
              snippet: kg.description || null
            });
          }
        }
      }

      logger.info(`[SEARCH] Provider returned ${rawResults.length} raw results`);
      return rawResults;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        logger.error('[SEARCH] Request to SerpApi timed out');
        throw new SearchTimeoutError();
      }

      if (error.response) {
        const status = error.response.status;
        const errMsg = error.response.data?.error || error.message;
        logger.error(`[SEARCH] SerpApi responded with status ${status}: ${errMsg}`);

        if (status === 401 || status === 403) {
          throw new SearchAuthError(`SerpApi authentication error: ${errMsg}`);
        }
        if (status === 429) {
          throw new SearchRateLimitError(`SerpApi rate limit exceeded: ${errMsg}`);
        }
        if (status >= 500) {
          throw new SearchUnavailableError(`SerpApi service error: ${errMsg}`);
        }
      }

      if (error instanceof SearchAuthError || error instanceof SearchRateLimitError || error instanceof SearchTimeoutError) {
        throw error;
      }

      logger.error(`[SEARCH] Visual search error: ${error.message}`);
      throw new SearchUnavailableError(`Failed to complete visual search: ${error.message}`);
    }
  }
}
