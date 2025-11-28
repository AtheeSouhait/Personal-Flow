import { apiClient } from './client';
import { Project, ProjectDetail, CreateProjectDto } from '@/types';

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>('/projects');
    return data;
  },

  getById: async (id: number): Promise<ProjectDetail> => {
    const { data } = await apiClient.get<ProjectDetail>(`/projects/${id}`);
    return data;
  },

  create: async (dto: CreateProjectDto): Promise<ProjectDetail> => {
    const { data } = await apiClient.post<ProjectDetail>('/projects', dto);
    return data;
  },

  update: async (id: number, dto: Partial<CreateProjectDto>): Promise<ProjectDetail> => {
    const { data } = await apiClient.put<ProjectDetail>(`/projects/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
