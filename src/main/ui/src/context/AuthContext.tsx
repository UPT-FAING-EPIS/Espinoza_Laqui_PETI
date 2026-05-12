import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, login as apiLogin } from '../api/authApi'
import { clearActivePetiGroupId } from '../session'
import type { ReactNode } from 'react'
import type { LoginCredentials, UserSummary } from '../types'

const AUTH_EXPIRED_EVENT = 'strategicti:auth-expired'

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
      .catch(() => {
        localStorage.removeItem('access_token')
        clearActivePetiGroupId()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    function handleAuthExpired() {
      clearActivePetiGroupId()
      setUser(null)
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  }, [])

  async function login(credentials: LoginCredentials) {
    const session = await apiLogin(credentials)
    localStorage.setItem('access_token', session.accessToken)
    clearActivePetiGroupId()
    setUser(session.user)
  }

  function logout() {
    localStorage.removeItem('access_token')
    clearActivePetiGroupId()
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
