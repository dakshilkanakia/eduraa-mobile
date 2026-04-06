/**
 * Eduraa Mobile — Exams API
 */

import apiClient from './client'
import type { StudentExamRead, Exam, ExamCreate } from '../types'

export const examsApi = {
  /** Student: fetch exams assigned by teacher */
  getStudentExams: async (): Promise<StudentExamRead[]> => {
    const response = await apiClient.get<StudentExamRead[]>('/exams/student')
    return response.data
  },

  /** Teacher: fetch all exams created by this teacher */
  getTeacherExams: async (): Promise<Exam[]> => {
    const response = await apiClient.get<Exam[]>('/exams')
    return response.data
  },

  /** Teacher: create a new exam */
  create: async (data: ExamCreate): Promise<Exam> => {
    const response = await apiClient.post<Exam>('/exams', data)
    return response.data
  },

  /** Teacher: update an existing exam */
  update: async (id: string, data: Partial<ExamCreate>): Promise<Exam> => {
    const response = await apiClient.patch<Exam>(`/exams/${id}`, data)
    return response.data
  },

  /** Teacher: delete an exam */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/exams/${id}`)
  },
}
