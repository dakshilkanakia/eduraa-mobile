/**
 * Eduraa Mobile — Auth Store (Zustand)
 * Mirrors frontend/src/stores/authStore.ts
 * Uses SecureStore instead of localStorage
 */

import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import { TOKEN_KEY, registerLogoutCallback } from '../api/client'
import type { AccountMinimal, AuthToken } from '../types'

interface AuthState {
  user: AccountMinimal | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setAuth: (authToken: AuthToken) => Promise<void>
  logout: () => Promise<void>
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Register logout callback so axios interceptor can trigger it
  registerLogoutCallback(() => {
    get().logout()
  })

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: async (authToken: AuthToken) => {
      try {
        await SecureStore.setItemAsync(TOKEN_KEY, authToken.access_token)
      } catch (e) {
        // SecureStore unavailable in web/simulator fallback
      }
      set({
        user: authToken.user,
        token: authToken.access_token,
        isAuthenticated: true,
        isLoading: false,
      })
    },

    logout: async () => {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY)
      } catch (e) {
        // ignore
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    },

    loadFromStorage: async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY)
        if (token) {
          // Token exists — we'll validate via /auth/me in the app root
          set({ token, isLoading: false })
        } else {
          set({ isLoading: false })
        }
      } catch (e) {
        set({ isLoading: false })
      }
    },
  }
})
