import { apiClient } from './client'
import type { ActivityEntry, ActivityLog, CreateActivityDto, UpdateActivityGoalDto, UpsertActivityLogDto } from '@/types'

export const activitiesApi = {
  getForDate: async (date: string): Promise<ActivityEntry[]> => {
    const response = await apiClient.get('/activities', { params: { date } })
    return response.data
  },

  getLogsForDate: async (date: string): Promise<ActivityLog[]> => {
    const response = await apiClient.get('/activities/logs', { params: { date } })
    return response.data
  },

  create: async (date: string, data: CreateActivityDto): Promise<ActivityEntry> => {
    const response = await apiClient.post('/activities', data, { params: { date } })
    return response.data
  },

  updateGoal: async (id: number, data: UpdateActivityGoalDto): Promise<void> => {
    await apiClient.put(`/activities/${id}/goal`, data)
  },

  upsertLog: async (id: number, date: string, data: UpsertActivityLogDto): Promise<ActivityEntry> => {
    const response = await apiClient.put(`/activities/${id}/logs/${date}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/activities/${id}`)
  },
}
