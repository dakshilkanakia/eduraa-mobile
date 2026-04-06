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
  Topic,
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

  /** Teacher: get topics for a subject (used in paper generation) */
  getTopics: async (subjectId: string): Promise<Topic[]> => {
    const response = await apiClient.get<Topic[]>('/topics', {
      params: { subject_id: subjectId },
    })
    return response.data
  },

  /** Teacher: publish a draft paper so students can see it */
  publish: async (paperId: string): Promise<Paper> => {
    const response = await apiClient.post<Paper>(`/papers/${paperId}/publish`)
    return response.data
  },

  /** Teacher: update paper metadata (title, duration, category, etc.) */
  update: async (paperId: string, data: Partial<Pick<Paper, 'title' | 'subtitle' | 'duration_minutes' | 'category' | 'instructions'>>): Promise<Paper> => {
    const response = await apiClient.patch<Paper>(`/papers/${paperId}`, data)
    return response.data
  },

  /** Teacher: export paper as PDF — returns a blob URL string via arraybuffer */
  exportPdf: async (paperId: string): Promise<ArrayBuffer> => {
    const response = await apiClient.get(`/papers/${paperId}/export/pdf`, {
      responseType: 'arraybuffer',
    })
    return response.data as ArrayBuffer
  },

  /** Teacher: regenerate specific questions in an existing paper */
  regenerate: async (paperId: string, config: Record<string, unknown>): Promise<Paper> => {
    const response = await apiClient.post<Paper>(`/papers/${paperId}/regenerate`, config)
    return response.data
  },
}
