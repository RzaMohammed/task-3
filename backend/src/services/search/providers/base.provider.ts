import { SearchImageInput, RawSearchResult } from '../search.types';

export interface SearchProvider {
  readonly name: string;
  searchByImage(input: SearchImageInput): Promise<RawSearchResult[]>;
}
