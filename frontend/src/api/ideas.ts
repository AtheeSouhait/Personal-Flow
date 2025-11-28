import { apiClient } from './client';
import { Idea, CreateIdeaDto } from '@/types';

export const ideasApi = {
  getAll: async (projectId?: number): Promise<Idea[]> => {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get<Idea[]>('/ideas', { params });
    return data;
  },

  getById: async (id: number): Promise<Idea> => {
    const { data } = await apiClient.get<Idea>(`/ideas/${id}`);
    return data;
  },

  create: async (dto: CreateIdeaDto): Promise<Idea> => {
    const { data } = await apiClient.post<Idea>('/ideas', dto);
    return data;
  },

  update: async (id: number, dto: Partial<CreateIdeaDto>): Promise<Idea> => {
    const { data } = await apiClient.put<Idea>(`/ideas/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ideas/${id}`);
  },
};
