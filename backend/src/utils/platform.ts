import { ResultType } from '../services/search/search.types';

export interface PlatformInfo {
  source: string;
  resultType: ResultType;
}

const SOCIAL_PLATFORMS: Record<string, string> = {
  'instagram.com': 'instagram',
  'facebook.com': 'facebook',
  'fb.com': 'facebook',
  'twitter.com': 'x',
  'x.com': 'x',
  'tiktok.com': 'tiktok',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'linkedin.com': 'linkedin',
  'reddit.com': 'reddit',
  'pinterest.com': 'pinterest',
  'threads.net': 'threads',
  'weibo.com': 'weibo',
  'vk.com': 'vk',
  'tumblr.com': 'tumblr',
  'flickr.com': 'flickr',
};

/**
 * Parses URL to identify source platform domain and classify candidate result type.
 */
export function getSourcePlatform(url: string): PlatformInfo {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Check known social platforms
    for (const [domain, platformName] of Object.entries(SOCIAL_PLATFORMS)) {
      if (host === domain || host.endsWith('.' + domain)) {
        return {
          source: platformName,
          resultType: 'social_media'
        };
      }
    }

    // Classify direct image URLs
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.match(/\.(jpg|jpeg|png|webp|gif|svg)$/)) {
      return {
        source: host.replace(/^www\./, ''),
        resultType: 'image'
      };
    }

    // Default standard web page
    return {
      source: host.replace(/^www\./, ''),
      resultType: 'web_page'
    };
  } catch (err) {
    return {
      source: 'web',
      resultType: 'unknown'
    };
  }
}
