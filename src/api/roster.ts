/**
 * Eduraa Mobile — Roster API
 * Covers student-teacher relationships for both student and teacher roles.
 */

import apiClient from './client'
import type {
  StudentTeachersResponse,
  TeacherMasterProfile,
  StudentRosterEntry,
  ClassTeacherOptions,
  CreateStudentRequest,
} from '../types'

export const rosterApi = {
  // ── Student-side ────────────────────────────────────────────────────────────

  /** Student: get assigned teachers and subject assignments */
  getStudentTeachers: async (): Promise<StudentTeachersResponse> => {
    const response = await apiClient.get<StudentTeachersResponse>('/roster/student/teachers')
    return response.data
  },

  /** Student: get master profile (subject mappings, books, etc.) */
  getStudentMasterProfile: async (): Promise<TeacherMasterProfile> => {
    const response = await apiClient.get<TeacherMasterProfile>('/roster/student/master-profile')
    return response.data
  },

  // ── Teacher-side ─────────────────────────────────────────────────────────────

  /** Teacher: get list of students in teacher's sections */
  getTeacherStudents: async (): Promise<StudentRosterEntry[]> => {
    const response = await apiClient.get<StudentRosterEntry[]>('/roster/teacher/students')
    return response.data
  },

  /** Teacher: get master profile (subjects, mappings, students, documents) */
  getTeacherMasterProfile: async (): Promise<TeacherMasterProfile> => {
    const response = await apiClient.get<TeacherMasterProfile>('/roster/teacher/master-profile')
    return response.data
  },

  /** Teacher (class teacher): update a student's division */
  updateStudentDivision: async (studentId: string, division: string): Promise<StudentRosterEntry> => {
    const response = await apiClient.patch<StudentRosterEntry>(
      `/roster/teacher/students/${studentId}`,
      { division }
    )
    return response.data
  },

  // ── Class teacher ────────────────────────────────────────────────────────────

  /** Class teacher: get available standards and divisions */
  getClassTeacherOptions: async (): Promise<ClassTeacherOptions> => {
    const response = await apiClient.get<ClassTeacherOptions>('/class-teacher/options')
    return response.data
  },

  /** Class teacher: create a new student account */
  createStudent: async (data: CreateStudentRequest): Promise<StudentRosterEntry> => {
    const response = await apiClient.post<StudentRosterEntry>('/class-teacher/students', data)
    return response.data
  },
}
