import {
  ChevronRight,
  FileText,
  Network,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGroups, listMyGroups } from '../api/groupApi'
import { listUsers } from '../api/userApi'
import { useAuth } from '../context/AuthContext'
import type { PlanningGroupSummary, UserSummary as UserSummaryType } from '../types'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return user.role === 'ADMINISTRADOR' ? <AdminDashboard user={user} /> : <UserDashboard user={user} />
}

function AdminDashboard({ user }: { user: UserSummaryType }) {
  const navigate = useNavigate()
  const [userCount, setUserCount] = useState<number | null>(null)
  const [groupCount, setGroupCount] = useState<number | null>(null)

  useEffect(() => {
    listUsers().then((list) => setUserCount(list.length)).catch(() => {})
    listGroups().then((list) => setGroupCount(list.length)).catch(() => {})
  }, [])

  return (
    <div className="dash">
      <header className="dash-header">
        <h1>Bienvenido, {user.firstName}</h1>
        <p className="dash-subtitle">Panel de administracion - StrategicTI</p>
      </header>

      <div className="dash-cards">
        <button type="button" className="dash-action-card" onClick={() => navigate('/admin/users')}>
          <div className="dash-action-icon dash-action-icon--blue">
            <Users size={28} />
          </div>
          <div className="dash-action-body">
            <strong>Gestion de usuarios</strong>
            <span>Crear, editar y administrar cuentas de usuario del sistema</span>
            {userCount !== null && (
              <div className="dash-action-stat">
                <span className="dash-stat-value">{userCount}</span>
                <span className="dash-stat-label">usuarios registrados</span>
              </div>
            )}
          </div>
          <ChevronRight size={20} className="dash-action-arrow" />
        </button>

        <button type="button" className="dash-action-card" onClick={() => navigate('/admin/groups')}>
          <div className="dash-action-icon dash-action-icon--indigo">
            <Network size={28} />
          </div>
          <div className="dash-action-body">
            <strong>Gestion de grupos</strong>
            <span>Crear grupos de planificacion, asignar miembros y definir roles</span>
            {groupCount !== null && (
              <div className="dash-action-stat">
                <span className="dash-stat-value">{groupCount}</span>
                <span className="dash-stat-label">grupos activos</span>
              </div>
            )}
          </div>
          <ChevronRight size={20} className="dash-action-arrow" />
        </button>

        <button type="button" className="dash-action-card" onClick={() => navigate('/plan')}>
          <div className="dash-action-icon dash-action-icon--teal">
            <FileText size={28} />
          </div>
          <div className="dash-action-body">
            <strong>Plan PETI</strong>
            <span>Acceder al plan estrategico de tecnologias de la informacion</span>
          </div>
          <ChevronRight size={20} className="dash-action-arrow" />
        </button>
      </div>
    </div>
  )
}

function UserDashboard({ user }: { user: UserSummaryType }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<PlanningGroupSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMyGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="dash">
      <header className="dash-header">
        <h1>Bienvenido, {user.firstName}</h1>
        <p className="dash-subtitle">Tus grupos de planificacion</p>
      </header>

      {loading && (
        <div className="dash-loading">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="dash-skeleton-card" key={i} />
          ))}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="dash-empty">
          <div className="dash-empty-icon">
            <Network size={48} />
          </div>
          <h2>Sin grupos asignados</h2>
          <p>Aun no perteneces a ningun grupo de planificacion. Contacta a un administrador para ser asignado.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="dash-group-list">
          {groups.map((group) => {
            const myMember = group.members.find((m) => m.userId === user.id)
            return (
              <article className="dash-group-card" key={group.id}>
                <div className="dash-group-header">
                  <div className="dash-group-icon">
                    <Network size={20} />
                  </div>
                  <div className="dash-group-title">
                    <strong>{group.name}</strong>
                    {myMember && (
                      <span className={`dash-role-badge dash-role-badge--${myMember.role.toLowerCase()}`}>
                        {myMember.role === 'LIDER' ? 'Lider' : 'Editor'}
                      </span>
                    )}
                  </div>
                </div>
                {group.description && <p className="dash-group-desc">{group.description}</p>}
                <div className="dash-group-meta">
                  <Users size={14} />
                  <span>{group.members.length} miembro{group.members.length !== 1 ? 's' : ''}</span>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="dash-cards" style={{ marginTop: 24 }}>
        <button type="button" className="dash-action-card" onClick={() => navigate('/plan')}>
          <div className="dash-action-icon dash-action-icon--teal">
            <FileText size={28} />
          </div>
          <div className="dash-action-body">
            <strong>Plan PETI</strong>
            <span>Acceder al plan estrategico de tecnologias de la informacion</span>
          </div>
          <ChevronRight size={20} className="dash-action-arrow" />
        </button>
      </div>
    </div>
  )
}
