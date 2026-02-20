/**
 * Eduraa Mobile — Axios API Client
 * Mirrors frontend/src/api/client.ts — JWT auth + 401 auto-logout
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import * as SecureStore from 'expo-secure-store'

// ─── Config ───────────────────────────────────────────────────────────────────

// Use your Mac's local IP when testing on a physical device
// Run `ipconfig getifaddr en0` in terminal to get your IP
export const API_BASE_URL = 'http://192.168.1.241:8000'

export const TOKEN_KEY = 'eduraa_access_token'

// ─── Client ───────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor — attach JWT ────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY)
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    } catch (e) {
      // SecureStore unavailable (simulator/web), continue without token
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor — 401 auto-logout ──────────────────────────────────

let logoutCallback: (() => void) | null = null

export function registerLogoutCallback(cb: () => void) {
  logoutCallback = cb
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stored token and trigger logout in auth store
      SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
      if (logoutCallback) {
        logoutCallback()
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
