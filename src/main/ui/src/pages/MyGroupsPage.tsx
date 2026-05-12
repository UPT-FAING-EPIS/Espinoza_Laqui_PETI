import { ChevronDown, ChevronUp, FileText, Network, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyGroups } from '../api/groupApi'
import { useAuth } from '../context/AuthContext'
import type { PlanningGroupSummary } from '../types'
import './MyGroupsPage.css'

export default function MyGroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<PlanningGroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    listMyGroups()
      .then(setGroups)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="mygroups">
      <header className="mygroups-header">
        <h1>Mis grupos</h1>
        <p className="mygroups-subtitle">Grupos de planificacion en los que participas</p>
      </header>

      {loading && (
        <div className="mygroups-skeleton-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="mygroups-skeleton" key={i} />
          ))}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="mygroups-empty">
          <div className="mygroups-empty-icon">
            <Network size={48} />
          </div>
          <h2>Sin grupos asignados</h2>
          <p>Aun no perteneces a ningun grupo. Contacta a un administrador para ser asignado.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="mygroups-list">
          {groups.map((group) => {
            const expanded = expandedId === group.id
            const myMember = group.members.find((m) => m.userId === user?.id)
            return (
              <article className={`mygroups-card ${expanded ? 'expanded' : ''}`} key={group.id}>
                <button
                  type="button"
                  className="mygroups-card-header"
                  onClick={() => toggleExpand(group.id)}
                >
                  <div className="mygroups-card-icon">
                    <Network size={20} />
                  </div>
                  <div className="mygroups-card-info">
                    <strong>{group.name}</strong>
                    <span>{group.members.length} miembro{group.members.length !== 1 ? 's' : ''}</span>
                  </div>
                  {myMember && (
                    <span className={`mygroups-role mygroups-role--${myMember.role.toLowerCase()}`}>
                      {myMember.role === 'LIDER' ? 'Lider' : 'Editor'}
                    </span>
                  )}
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {expanded && (
                  <div className="mygroups-card-body">
                    {group.description && <p className="mygroups-desc">{group.description}</p>}
                    <div className="mygroups-members-title">
                      <Users size={14} />
                      <span>Miembros</span>
                    </div>
                    <div className="mygroups-members">
                      {group.members.map((m) => (
                        <div className="mygroups-member" key={m.userId}>
                          <div className="mygroups-member-avatar">
                            {m.firstName.charAt(0)}{m.lastName.charAt(0)}
                          </div>
                          <div className="mygroups-member-info">
                            <strong>{m.firstName} {m.lastName}</strong>
                            <span>{m.email}</span>
                          </div>
                          <span className={`mygroups-role mygroups-role--${m.role.toLowerCase()}`}>
                            {m.role === 'LIDER' ? 'Lider' : 'Editor'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mygroups-actions">
                      <Link className="mygroups-plan-link" to={`/groups/${group.id}/plan`}>
                        <FileText size={16} />
                        Abrir plan PETI
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
