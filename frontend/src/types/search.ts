/**
 * TypeScript interfaces for reverse image search and face matching.
 */

export type SearchProvider = 'serpapi' | 'bing' | 'mock';

export interface VisualSearchItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  platform?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  publishedDate?: string;
}

export interface SimilarityMatch {
  matched: boolean;
  similarity: number;
  confidenceThreshold: number;
  targetImageUrl?: string;
  matchedImageUrl?: string;
  faceBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SearchResponsePayload {
  success: boolean;
  provider: SearchProvider;
  totalResults: number;
  results: VisualSearchItem[];
  bestMatch?: SimilarityMatch;
  queryTimeMs: number;
  timestamp: string;
}
