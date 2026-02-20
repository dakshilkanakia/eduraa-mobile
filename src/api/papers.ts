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
  Chapter,
} from '../types'

export const papersApi = {
  getOptions: async (): Promise<PaperOptions> => {
    const response = await apiClient.get<PaperOptions>('/papers/options')
    return response.data
  },

  /** Chapters are fetched separately per subject — GET /chapters?subject_id=... */
  getChapters: async (subjectId: string): Promise<Chapter[]> => {
    const response = await apiClient.get<Chapter[]>('/chapters', {
      params: { subject_id: subjectId },
    })
    return response.data
  },

  generate: async (data: PaperGenerateRequest): Promise<Paper> => {
    const response = await apiClient.post<Paper>('/papers/generate', data)
    return response.data
  },

  // Backend uses skip/limit (not page/size)
  list: async (params?: {
    skip?: number
    limit?: number
    subject_id?: string
    status?: string
  }): Promise<PaginatedResponse<PaperListItem>> => {
    const response = await apiClient.get<PaginatedResponse<PaperListItem>>('/papers', { params })
    return response.data
  },

  getById: async (paperId: string): Promise<Paper> => {
    const response = await apiClient.get<Paper>(`/papers/${paperId}`)
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
    data: { question_id: string; mode: 'hint' | 'explain' | 'mistake'; student_answer?: string }
  ): Promise<{ content: string }> => {
    const response = await apiClient.post(`/papers/${paperId}/interactive/assist`, data)
    return response.data
  },
}
