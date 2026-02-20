/**
 * Convenience hook for auth state + actions
 */

import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, logout } = useAuthStore()
  const isB2C = user?.role === 'b2c_student'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isB2C,
    setAuth,
    logout,
  }
}
