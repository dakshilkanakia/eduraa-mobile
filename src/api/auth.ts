/**
 * Eduraa Mobile — Auth API
 */

import apiClient from './client'
import type { AuthToken, B2CRegisterRequest } from '../types'

export interface LoginRequest {
  username: string // email or identifier
  password: string
}

export interface RegistrationChallenge {
  email: string
  message: string
  requires_verification: boolean
  delivery_channel: string
  dev_otp?: string | null
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/login', {
      identifier: data.username,
      password: data.password,
    })
    return response.data
  },

  registerIndividual: async (data: B2CRegisterRequest): Promise<RegistrationChallenge> => {
    const response = await apiClient.post<RegistrationChallenge>('/auth/register/individual', data)
    return response.data
  },

  verifyEmailOtp: async (email: string, otp: string): Promise<AuthToken> => {
    const response = await apiClient.post<AuthToken>('/auth/verify-email-otp', { email, otp })
    return response.data
  },

  resendEmailOtp: async (email: string): Promise<RegistrationChallenge> => {
    const response = await apiClient.post<RegistrationChallenge>('/auth/resend-email-otp', { email })
    return response.data
  },

  me: async (): Promise<AuthToken['user']> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}
