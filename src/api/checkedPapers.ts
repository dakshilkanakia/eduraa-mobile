/**
 * Eduraa Mobile — Checked Papers API
 */

import apiClient from './client'
import type { CheckedPaper, PaginatedResponse } from '../types'

export const checkedPapersApi = {
  list: async (params?: {
    page?: number
    size?: number
  }): Promise<PaginatedResponse<CheckedPaper>> => {
    const response = await apiClient.get<PaginatedResponse<CheckedPaper>>('/checked-papers', { params })
    return response.data
  },

  getById: async (id: string): Promise<CheckedPaper> => {
    const response = await apiClient.get<CheckedPaper>(`/checked-papers/${id}`)
    return response.data
  },

  requestManualReview: async (id: string): Promise<CheckedPaper> => {
    const response = await apiClient.post<CheckedPaper>(`/checked-papers/${id}/manual-review-request`)
    return response.data
  },
}
