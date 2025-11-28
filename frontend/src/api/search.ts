import { apiClient } from './client';
import { SearchResult } from '@/types';

export const searchApi = {
  search: async (query: string): Promise<SearchResult> => {
    const { data } = await apiClient.get<SearchResult>('/search', {
      params: { q: query },
    });
    return data;
  },
};
