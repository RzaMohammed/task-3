import { SearchFactory } from './search.factory';
import { SearchImageInput, SearchResult, SearchResponsePayload } from './search.types';
import { getSourcePlatform } from '../../utils/platform';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { NoSearchResultsError } from '../../utils/errors';

export class SearchService {
  /**
   * Performs visual search using the configured provider, validates URLs,
   * classifies platform domains, and normalizes output into a unified SearchResult schema.
   */
  public static async searchByImage(input: SearchImageInput, overrideProvider?: string): Promise<SearchResponsePayload> {
    logger.info('[SEARCH] Image search requested');
    const provider = SearchFactory.getProvider(overrideProvider);

    const rawResults = await provider.searchByImage(input);

    if (!rawResults || rawResults.length === 0) {
      logger.info('[SEARCH] No search results returned from provider');
      throw new NoSearchResultsError();
    }

    logger.info('[SEARCH] Normalizing results');
    const validResults: SearchResult[] = [];
    let socialCount = 0;
    let webCount = 0;

    for (let i = 0; i < rawResults.length; i++) {
      const raw = rawResults[i];

      // Validate URL presence and protocol
      if (!raw.link || typeof raw.link !== 'string') {
        continue;
      }

      const trimmedUrl = raw.link.trim();
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
        continue;
      }

      // Classify source platform and domain
      const { source, resultType } = getSourcePlatform(trimmedUrl);
      if (resultType === 'social_media') {
        socialCount++;
      } else {
        webCount++;
      }

      validResults.push({
        id: `match-${i + 1}`,
        title: raw.title || null,
        url: trimmedUrl,
        source: raw.source || source,
        imageUrl: raw.imageUrl || raw.thumbnail || null,
        thumbnailUrl: raw.thumbnail || raw.imageUrl || null,
        description: raw.snippet || null,
        publishedAt: raw.date || null,
        resultType,
        metadata: raw.rawMetadata || {}
      });

      // Limit results
      if (validResults.length >= config.SEARCH_MAX_RESULTS) {
        break;
      }
    }

    if (validResults.length === 0) {
      logger.info('[SEARCH] No valid HTTP/HTTPS URLs remained after normalization');
      throw new NoSearchResultsError('Visual search returned no valid candidate web URLs.');
    }

    logger.info(`[SEARCH] Social-media candidates: ${socialCount}`);
    logger.info(`[SEARCH] Web candidates: ${webCount}`);
    logger.info(`[SEARCH] Search completed with ${validResults.length} normalized candidates`);

    return {
      success: true,
      query_type: 'visual_image_search',
      result_count: validResults.length,
      results: validResults
    };
  }
}
