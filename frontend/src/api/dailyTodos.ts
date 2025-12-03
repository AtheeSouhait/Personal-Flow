import { apiClient } from './client'
import type { DailyTodo, CreateDailyTodoDto, UpdateDailyTodoDto, ReorderDailyTodosDto } from '@/types'

export const dailyTodosApi = {
  getAll: async (): Promise<DailyTodo[]> => {
    const response = await apiClient.get('/daily-todos')
    return response.data
  },

  getById: async (id: number): Promise<DailyTodo> => {
    const response = await apiClient.get(`/daily-todos/${id}`)
    return response.data
  },

  create: async (data: CreateDailyTodoDto): Promise<DailyTodo> => {
    const response = await apiClient.post('/daily-todos', data)
    return response.data
  },

  update: async (id: number, data: UpdateDailyTodoDto): Promise<DailyTodo> => {
    const response = await apiClient.put(`/daily-todos/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/daily-todos/${id}`)
  },

  reorder: async (data: ReorderDailyTodosDto): Promise<void> => {
    await apiClient.post('/daily-todos/reorder', data)
  },
}
