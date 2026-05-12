import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'
import AppShell from './layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import GroupsPage from './pages/GroupsPage'
import GroupPlanPage from './pages/GroupPlanPage'
import LoginPage from './pages/LoginPage'
import MyGroupsPage from './pages/MyGroupsPage'
import PlanGatewayPage from './pages/PlanGatewayPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'
import type { ReactNode } from 'react'

import type { DefaultView, UserSummary } from './types'

const defaultViewRoutes: Record<DefaultView, string> = {
  CURRENT_PLAN: '/plan',
  MY_GROUPS: '/my-groups',
  USER_MANAGEMENT: '/admin/users',
  GROUP_MANAGEMENT: '/admin/groups',
}

function resolveDefaultViewRoute(user: UserSummary) {
  if (!user.defaultView) {
    return user.role === 'ADMINISTRADOR' ? '/admin/users' : '/my-groups'
  }

  if (
    user.role !== 'ADMINISTRADOR'
    && (user.defaultView === 'USER_MANAGEMENT' || user.defaultView === 'GROUP_MANAGEMENT')
  ) {
    return '/my-groups'
  }

  return defaultViewRoutes[user.defaultView]
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to={resolveDefaultViewRoute(user)} replace />
  }
  return <>{children}</>
}

function DefaultViewRoute() {
  const { user } = useAuth()
  if (!user) return null
  return <Navigate to={resolveDefaultViewRoute(user)} replace />
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user || user.role !== 'ADMINISTRADOR') return <Navigate to="/" replace />
  return <>{children}</>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DefaultViewRoute />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="plan" element={<PlanGatewayPage />} />
            <Route path="groups/:groupId/plan" element={<GroupPlanPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="my-groups" element={<MyGroupsPage />} />
            <Route
              path="admin/users"
              element={<AdminRoute><UsersPage /></AdminRoute>}
            />
            <Route
              path="admin/groups"
              element={<AdminRoute><GroupsPage /></AdminRoute>}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
