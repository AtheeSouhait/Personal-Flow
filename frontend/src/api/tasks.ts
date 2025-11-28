import { apiClient } from './client';
import { Task, CreateTaskDto } from '@/types';

export const tasksApi = {
  getAll: async (projectId?: number): Promise<Task[]> => {
    const params = projectId ? { projectId } : {};
    const { data } = await apiClient.get<Task[]>('/tasks', { params });
    return data;
  },

  getById: async (id: number): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  create: async (dto: CreateTaskDto): Promise<Task> => {
    const { data } = await apiClient.post<Task>('/tasks', dto);
    return data;
  },

  update: async (id: number, dto: Partial<CreateTaskDto>): Promise<Task> => {
    const { data } = await apiClient.put<Task>(`/tasks/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
