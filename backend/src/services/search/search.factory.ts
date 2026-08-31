import { SearchProvider } from './providers/base.provider';
import { SerpApiVisualSearchProvider } from './providers/serpapi.provider';
import { MockSearchProvider } from './providers/mock.provider';
import { config } from '../../config';

export class SearchFactory {
  private static instance: SearchProvider | null = null;
  private static mockInstance: MockSearchProvider | null = null;

  public static getProvider(overrideType?: string): SearchProvider {
    const providerType = overrideType || config.SEARCH_PROVIDER;

    if (providerType === 'mock') {
      if (!this.mockInstance) {
        this.mockInstance = new MockSearchProvider();
      }
      return this.mockInstance;
    }

    if (!this.instance) {
      this.instance = new SerpApiVisualSearchProvider();
    }
    return this.instance;
  }

  public static getMockProvider(): MockSearchProvider {
    if (!this.mockInstance) {
      this.mockInstance = new MockSearchProvider();
    }
    return this.mockInstance;
  }
}
