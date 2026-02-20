/**
 * Eduraa Mobile — Papers API
 */

import apiClient from './client'
import type {
  Paper,
  PaperListItem,
  PaperGenerateRequest,
  PaperSubmissionCreate,
  PaperSubmissionRead,
  PaperOptions,
  PaginatedResponse,
} from '../types'

export const papersApi = {
  getOptions: async (): Promise<PaperOptions> => {
    const response = await apiClient.get<PaperOptions>('/papers/options')
    return response.data
  },

  generate: async (data: PaperGenerateRequest): Promise<Paper> => {
    const response = await apiClient.post<Paper>('/papers/generate', data)
    return response.data
  },

  list: async (params?: {
    page?: number
    size?: number
    subject_id?: string
  }): Promise<PaginatedResponse<PaperListItem>> => {
    const response = await apiClient.get<PaginatedResponse<PaperListItem>>('/papers', { params })
    return response.data
  },

  getById: async (paperId: string): Promise<Paper> => {
    const response = await apiClient.get<Paper>(`/papers/${paperId}`)
    return response.data
  },

  getInteractive: async (paperId: string): Promise<Paper> => {
    const response = await apiClient.get<Paper>(`/papers/${paperId}/interactive`)
    return response.data
  },

  submit: async (paperId: string, data: PaperSubmissionCreate): Promise<PaperSubmissionRead> => {
    const response = await apiClient.post<PaperSubmissionRead>(`/papers/${paperId}/submit`, data)
    return response.data
  },

  getSubmission: async (paperId: string): Promise<PaperSubmissionRead> => {
    const response = await apiClient.get<PaperSubmissionRead>(`/papers/${paperId}/submission`)
    return response.data
  },

  getInteractiveAssist: async (
    paperId: string,
    data: { question_id: string; type: 'hint' | 'explanation' }
  ): Promise<{ content: string }> => {
    const response = await apiClient.post(`/papers/${paperId}/interactive/assist`, data)
    return response.data
  },
}
