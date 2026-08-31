import { SearchResult } from '../search/search.types';

export type CandidateStatus =
  | 'MATCHED'
  | 'BELOW_THRESHOLD'
  | 'NO_FACE'
  | 'MULTIPLE_FACES'
  | 'IMAGE_DOWNLOAD_FAILED'
  | 'INVALID_IMAGE';

export interface CandidateMatchResult {
  id: string;
  url: string;
  title: string | null;
  source: string | null;
  imageUrl: string | null;
  resultType: string;
  status: CandidateStatus;
  similarity: number | null;
  similarity_percentage: number | null;
  errorDetail?: string;
}

export interface BestMatchSummary {
  id: string;
  url: string;
  title: string | null;
  source: string | null;
  imageUrl: string | null;
  similarity: number;
  similarity_percentage: number;
}

export interface MatchingInput {
  sourceEmbedding: number[];
  searchResults: SearchResult[];
}

export interface MatchingResponse {
  success: boolean;
  match_found: boolean;
  reason?: 'MATCH_FOUND' | 'NO_CONFIDENT_MATCH' | 'NO_USABLE_CANDIDATES';
  best_match?: BestMatchSummary;
  best_similarity?: number | null;
  threshold: number;
  candidates_processed: number;
  candidates_with_faces: number;
  candidates?: CandidateMatchResult[];
}
