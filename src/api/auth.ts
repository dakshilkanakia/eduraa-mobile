/**
 * Eduraa Mobile — Auth API
 */

import apiClient from './client'
import type { AuthToken, B2CRegisterRequest } from '../types'

export interface LoginRequest {
  username: string // email or identifier
  password: string
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/login', {
      identifier: data.username,
      password: data.password,
    })
    return response.data
  },

  registerIndividual: async (data: B2CRegisterRequest & { confirm_password: string }): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/register/individual', data)
    return response.data
  },

  me: async (): Promise<AuthToken['user']> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
