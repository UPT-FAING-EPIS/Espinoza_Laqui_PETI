import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Network,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { SystemRole } from '../types'
import './AppShell.css'

type NavItem = {
  to: string
  icon: LucideIcon
  label: string
  roles: SystemRole[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMINISTRADOR', 'USUARIO'] },
  { to: '/plan', icon: FileText, label: 'Plan PETI', roles: ['ADMINISTRADOR', 'USUARIO'] },
  { to: '/my-groups', icon: Network, label: 'Mis grupos', roles: ['USUARIO'] },
  { to: '/admin/users', icon: Users, label: 'Usuarios', roles: ['ADMINISTRADOR'] },
  { to: '/admin/groups', icon: Network, label: 'Grupos', roles: ['ADMINISTRADOR'] },
  { to: '/profile', icon: User, label: 'Mi perfil', roles: ['ADMINISTRADOR', 'USUARIO'] },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return window.localStorage.getItem('strategicti.sidebar.collapsed') === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem('strategicti.sidebar.collapsed', String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  if (!user) return null

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <div className={`shell ${isSidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
      {/* ---- SIDEBAR ---- */}
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-card">
            <div className="shell-brand-text">
              <strong>StrategicTI</strong>
              <span>Plan Estrategico de TI</span>
            </div>
            <button
              type="button"
              className="shell-sidebar-toggle"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={isSidebarCollapsed ? 'Expandir panel lateral' : 'Compactar panel lateral'}
              title={isSidebarCollapsed ? 'Expandir panel lateral' : 'Compactar panel lateral'}
            >
              {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
          </div>
          <div className="shell-brand-divider" />
        </div>

        <nav className="shell-nav" aria-label="Navegacion principal">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={isSidebarCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={({ isActive }) =>
                `shell-nav-item ${isNavItemActive(item.to, isActive, location.pathname) ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              <ChevronRight size={14} className="shell-nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="shell-sidebar-footer">
          <div className="shell-user-card">
            <div className="shell-avatar">{initials}</div>
            <div className="shell-user-info">
              <strong>{user.firstName} {user.lastName}</strong>
              <span>{user.role === 'ADMINISTRADOR' ? 'Administrador' : 'Usuario'}</span>
            </div>
          </div>
          <button className="shell-logout" type="button" onClick={logout} title="Cerrar sesion" aria-label="Cerrar sesion">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  )
}

function isNavItemActive(to: string, isActive: boolean, pathname: string) {
  if (to === '/plan' && /^\/groups\/\d+\/plan/.test(pathname)) {
    return true
  }

  return isActive
}
