export type ResultType = 'social_media' | 'web_page' | 'image' | 'unknown';

export interface SearchImageInput {
  imageBuffer: Buffer;
  filename?: string;
  mimeType?: string;
}

export interface RawSearchResult {
  title?: string | null;
  link: string;
  source?: string | null;
  thumbnail?: string | null;
  imageUrl?: string | null;
  snippet?: string | null;
  date?: string | null;
  rawMetadata?: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  title: string | null;
  url: string;
  source: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  description: string | null;
  publishedAt: string | null;
  resultType: ResultType;
  metadata: Record<string, unknown>;
}

export interface SearchResponsePayload {
  success: boolean;
  query_type: string;
  result_count: number;
  results: SearchResult[];
}
