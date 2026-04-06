/**
 * Eduraa Mobile — Scan & Checked Papers API
 */

import apiClient from './client'
import type {
  CheckedPaper,
  CheckedPaperUploadOptions,
  TeacherReviewUpdate,
} from '../types'

export const scanApi = {
  /** Get options for upload form (exams, subjects, students, papers) */
  getOptions: async (): Promise<CheckedPaperUploadOptions> => {
    const response = await apiClient.get<CheckedPaperUploadOptions>('/checked-papers/options')
    return response.data
  },

  /**
   * Upload scanned answer sheet(s).
   * FormData must include: exam_id OR paper_id, subject_id, optional student_id, files[]
   * For custom paper mode also include: upload_mode = "custom_paper"
   */
  upload: async (formData: FormData): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      '/checked-papers/scan',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data
  },

  /** List checked papers with optional filters */
  list: async (params?: {
    exam_id?: string
    status?: string
    subject_id?: string
  }): Promise<CheckedPaper[]> => {
    const response = await apiClient.get<CheckedPaper[]>('/checked-papers', { params })
    return response.data
  },

  /** Get full detail for a single checked paper */
  getById: async (id: string): Promise<CheckedPaper> => {
    const response = await apiClient.get<CheckedPaper>(`/checked-papers/${id}`)
    return response.data
  },

  /** Get number of scanned pages for a checked paper */
  getPageCount: async (id: string): Promise<number> => {
    const response = await apiClient.get<{ page_count: number }>(
      `/checked-papers/${id}/scanned/pages`
    )
    return response.data.page_count
  },

  /**
   * Get a single scanned page as a base64 data URI.
   * Returns string like "data:image/png;base64,..."
   */
  getPage: async (id: string, page: number): Promise<string> => {
    const response = await apiClient.get(`/checked-papers/${id}/scanned/pages/${page}`, {
      responseType: 'arraybuffer',
    })
    const bytes = new Uint8Array(response.data as ArrayBuffer)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    const base64 = btoa(binary)
    const contentType = (response.headers['content-type'] as string) || 'image/png'
    return `data:${contentType};base64,${base64}`
  },

  /** Student: request manual teacher review for a checked paper */
  requestManualReview: async (id: string): Promise<void> => {
    await apiClient.post(`/checked-papers/${id}/manual-review-request`)
  },

  /** Teacher: submit score/feedback overrides and optionally publish results */
  teacherReview: async (id: string, data: TeacherReviewUpdate): Promise<CheckedPaper> => {
    const response = await apiClient.patch<CheckedPaper>(
      `/checked-papers/${id}/teacher-review`,
      data
    )
    return response.data
  },

  /** Teacher: toggle whether results are visible to student */
  publishResults: async (id: string, visible: boolean): Promise<CheckedPaper> => {
    const response = await apiClient.patch<CheckedPaper>(`/checked-papers/${id}/review`, {
      results_visible_to_student: visible,
    })
    return response.data
  },

  /** Teacher: trigger AI re-grading of a checked paper */
  regrade: async (id: string): Promise<CheckedPaper> => {
    const response = await apiClient.post<CheckedPaper>(`/checked-papers/${id}/regrade`)
    return response.data
  },
}
