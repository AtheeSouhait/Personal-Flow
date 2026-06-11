import { apiClient } from './client';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  ReorderTasksDto,
  Subtask,
  CreateSubtaskDto,
  UpdateSubtaskDto,
} from '@/types';

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

  update: async (id: number, dto: UpdateTaskDto): Promise<Task> => {
    const { data } = await apiClient.put<Task>(`/tasks/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },

  reorder: async (dto: ReorderTasksDto): Promise<void> => {
    await apiClient.post('/tasks/reorder', dto);
  },

  logTime: async (id: number, seconds: number): Promise<Task> => {
    const { data } = await apiClient.post<Task>(`/tasks/${id}/log-time`, { seconds });
    return data;
  },
};

export const subtasksApi = {
  create: async (taskId: number, dto: CreateSubtaskDto): Promise<Subtask> => {
    const { data } = await apiClient.post<Subtask>(`/tasks/${taskId}/subtasks`, dto);
    return data;
  },

  update: async (id: number, dto: UpdateSubtaskDto): Promise<Subtask> => {
    const { data } = await apiClient.put<Subtask>(`/subtasks/${id}`, dto);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/subtasks/${id}`);
  },
};
