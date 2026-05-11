import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, login as apiLogin } from '../api/authApi'
import type { ReactNode } from 'react'
import type { LoginCredentials, UserSummary } from '../types'

type AuthState = {
  user: UserSummary | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  updateUser: (updated: UserSummary) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem('access_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials: LoginCredentials) {
    const session = await apiLogin(credentials)
    localStorage.setItem('access_token', session.accessToken)
    setUser(session.user)
  }

  function logout() {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const updateUser = useCallback((updated: UserSummary) => setUser(updated), [])

  const value = useMemo(() => ({ user, loading, login, logout, updateUser }), [user, loading, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

