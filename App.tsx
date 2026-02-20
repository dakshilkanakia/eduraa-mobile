/**
 * Eduraa Mobile — Root App
 */

import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import RootNavigator from './src/navigation'
import { useAuthStore } from './src/stores/authStore'
import { authApi } from './src/api/auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

function AppContent() {
  const { setAuth, logout, isLoading } = useAuthStore()

  // On mount: load token from SecureStore, then validate with /auth/me
  useEffect(() => {
    const init = async () => {
      // loadFromStorage returns the token it found
      const store = useAuthStore.getState()
      await store.loadFromStorage()
      // Read token directly from store after loading
      const { token } = useAuthStore.getState()
      if (token) {
        try {
          const user = await authApi.me()
          // Reconstruct minimal auth state with the validated user
          setAuth({ access_token: token, token_type: 'bearer', user })
        } catch {
          // Token is invalid or expired
          logout()
        }
      }
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
