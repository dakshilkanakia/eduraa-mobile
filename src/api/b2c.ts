/**
 * Eduraa Mobile — B2C Student Profile API
 */

import apiClient from './client'
import type { B2CProfileRead } from '../types'

export interface B2CProfileUpdateRequest {
  first_name?: string
  last_name?: string
  school_name?: string
  board?: string
  standard?: string
  division?: string
  subjects?: string[]
  science_standard?: string
  science_exam?: string[]
  state_cet_states?: string[]
  current_password: string // required for profile updates
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
