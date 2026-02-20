/**
 * Eduraa Mobile — Checked Papers API
 * Backend returns a plain array (list[CheckedPaperListRead]), NOT a paginated object.
 */

import apiClient from './client'
import type { CheckedPaper } from '../types'

export const checkedPapersApi = {
  list: async (): Promise<CheckedPaper[]> => {
    const response = await apiClient.get<CheckedPaper[]>('/checked-papers')
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
