/**
 * Eduraa Mobile — Analytics API
 */

import apiClient from './client'
import type { StudentDashboardLab } from '../types'

export const analyticsApi = {
  getStudentDashboard: async (): Promise<StudentDashboardLab> => {
    const response = await apiClient.get<StudentDashboardLab>('/analytics/student-dashboard-lab')
    return response.data
  },
}
