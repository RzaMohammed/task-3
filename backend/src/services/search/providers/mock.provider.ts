import { SearchProvider } from './base.provider';
import { SearchImageInput, RawSearchResult } from '../search.types';
import { SearchAuthError, SearchTimeoutError } from '../../../utils/errors';

export class MockSearchProvider implements SearchProvider {
  public readonly name = 'mock';
  public behavior: 'success' | 'auth_error' | 'timeout' | 'empty' = 'success';

  public async searchByImage(input: SearchImageInput): Promise<RawSearchResult[]> {
    if (this.behavior === 'auth_error') {
      throw new SearchAuthError('Mock authentication failure');
    }
    if (this.behavior === 'timeout') {
      throw new SearchTimeoutError('Mock timeout failure');
    }
    if (this.behavior === 'empty') {
      return [];
    }

    // Return realistic test candidates including social media domains
    return [
      {
        title: 'Lena Forsen - Official Photography & Public Portrait Archive',
        link: 'https://www.instagram.com/p/C9xZ_example1/',
        source: 'Instagram',
        thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
        snippet: 'Official public social media portrait photo.'
      },
      {
        title: 'Public Profile & Keynote Speaker - Twitter / X',
        link: 'https://x.com/tech_speaker/status/1829381928391',
        source: 'X (Twitter)',
        thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        snippet: 'Keynote speech portrait release.'
      },
      {
        title: 'Technology Pioneer Profile - Wikipedia',
        link: 'https://en.wikipedia.org/wiki/Lenna',
        source: 'Wikipedia',
        thumbnail: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7d/Lenna_%28test_image%29.png',
        snippet: 'Standard test image widely used in digital image processing algorithms.'
      },
      {
        title: 'Verified Professional Profile - LinkedIn',
        link: 'https://www.linkedin.com/in/lenna-sample-profile',
        source: 'LinkedIn',
        thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        snippet: 'Professional profile and executive portrait.'
      }
    ];
  }
}
