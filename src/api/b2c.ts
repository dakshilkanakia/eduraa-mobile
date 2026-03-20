/**
 * Eduraa Mobile — B2C Student Profile API
 */

import apiClient from './client'
import type { B2CProfileRead } from '../types'

export interface B2CProfileUpdateRequest {
  password: string // required for profile updates
  education_level: import('../types').EducationLevel
  first_name?: string
  last_name?: string
  school_name?: string
  school_board?: string
  school_standard?: string
  subjects?: string[]
}

export const b2cApi = {
  getProfile: async (): Promise<B2CProfileRead> => {
    const response = await apiClient.get<B2CProfileRead>('/b2c/profile')
    return response.data
  },

  updateProfile: async (data: B2CProfileUpdateRequest): Promise<B2CProfileRead> => {
    const response = await apiClient.patch<B2CProfileRead>('/b2c/profile', data)
    return response.data
  },
}
