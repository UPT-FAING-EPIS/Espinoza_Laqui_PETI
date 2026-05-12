import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChevronLeft,
  CircleAlert,
  FileText,
  Network,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import {
  assignMember,
  createGroup,
  listGroups,
  removeMember,
  updateGroup,
  updateMemberRole,
} from '../api/groupApi'
import { listUsers } from '../api/userApi'
import type { GroupRole, PlanningGroupSummary, UserSummary } from '../types'
import './GroupsPage.css'

/* ---- Schemas ---- */

const groupSchema = z.object({
  name: z.string().min(1, 'Requerido').max(160),
  description: z.string().max(2000),
})

type GroupForm = z.infer<typeof groupSchema>

type ViewState =
  | { kind: 'list' }
  | { kind: 'detail'; group: PlanningGroupSummary }

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; group: PlanningGroupSummary }
  | { kind: 'assign'; group: PlanningGroupSummary }

export default function GroupsPage() {
  const [groups, setGroups] = useState<PlanningGroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<ViewState>({ kind: 'list' })
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    listGroups()
      .then(setGroups)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar grupos.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  function handleGroupUpdated(g: PlanningGroupSummary) {
    setGroups((prev) => prev.map((p) => (p.id === g.id ? g : p)))
    if (view.kind === 'detail' && view.group.id === g.id) {
      setView({ kind: 'detail', group: g })
    }
  }

  if (view.kind === 'detail') {
    return (
      <GroupDetail
        group={view.group}
        onBack={() => setView({ kind: 'list' })}
        onUpdated={handleGroupUpdated}
        onAssign={() => setModal({ kind: 'assign', group: view.group })}
        onEdit={() => setModal({ kind: 'edit', group: view.group })}
        modal={modal}
        setModal={setModal}
      />
    )
  }

  return (
    <div className="gpage">
      <header className="gpage-header">
        <div>
          <h1>Gestion de grupos</h1>
          <p className="gpage-subtitle">Grupos de planificacion y asignacion de miembros</p>
        </div>
        <button className="gpage-add-btn" type="button" onClick={() => setModal({ kind: 'create' })}>
          <Plus size={16} />
          Nuevo grupo
        </button>
      </header>

      {error && (
        <div className="gpage-alert"><CircleAlert size={16} /><span>{error}</span></div>
      )}

      {loading && (
        <div className="gpage-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="gpage-skeleton" key={i} />
          ))}
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="gpage-empty">
          <div className="gpage-empty-icon"><Network size={48} /></div>
          <h2>Sin grupos</h2>
          <p>Crea el primer grupo de planificacion.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="gpage-grid">
          {groups.map((g) => (
            <button
              type="button"
              className="gpage-card"
              key={g.id}
              onClick={() => setView({ kind: 'detail', group: g })}
            >
              <div className="gpage-card-icon">
                <Network size={22} />
              </div>
              <strong>{g.name}</strong>
              {g.description && <p>{g.description}</p>}
              <div className="gpage-card-meta">
                <Users size={14} />
                <span>{g.members.length} miembro{g.members.length !== 1 ? 's' : ''}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {modal.kind === 'create' && (
        <GroupFormModal
          title="Nuevo grupo"
          onClose={() => setModal({ kind: 'closed' })}
          onSave={async (values) => {
            const created = await createGroup(values)
            setGroups((prev) => [...prev, created])
            setModal({ kind: 'closed' })
          }}
        />
      )}
      {modal.kind === 'edit' && (
        <GroupFormModal
          title="Editar grupo"
          defaults={{ name: modal.group.name, description: modal.group.description }}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={async (values) => {
            const updated = await updateGroup(modal.group.id, values)
            handleGroupUpdated(updated)
            setModal({ kind: 'closed' })
          }}
        />
      )}
    </div>
  )
}

/* ---- Group Detail ---- */

function GroupDetail({
  group,
  onBack,
  onUpdated,
  onAssign,
  onEdit,
  modal,
  setModal,
}: {
  group: PlanningGroupSummary
  onBack: () => void
  onUpdated: (g: PlanningGroupSummary) => void
  onAssign: () => void
  onEdit: () => void
  modal: ModalState
  setModal: (m: ModalState) => void
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleRoleChange(userId: number, newRole: GroupRole) {
    try {
      const updated = await updateMemberRole(group.id, userId, { role: newRole })
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar rol.')
    }
  }

  async function handleRemove(userId: number) {
    try {
      const updated = await removeMember(group.id, userId)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al remover miembro.')
    }
  }

  return (
    <div className="gpage">
      <header className="gpage-detail-header">
        <button className="gpage-back-btn" type="button" onClick={onBack}>
          <ChevronLeft size={18} />
          Volver
        </button>
        <div className="gpage-detail-title">
          <h1>{group.name}</h1>
          {group.description && <p className="gpage-subtitle">{group.description}</p>}
        </div>
        <div className="gpage-detail-actions">
          <button className="gpage-act-btn" type="button" onClick={onEdit} title="Editar grupo">
            <Pencil size={16} />
          </button>
          <Link className="gpage-plan-btn" to={`/groups/${group.id}/plan`}>
            <FileText size={16} />
            Plan PETI
          </Link>
          <button className="gpage-add-btn" type="button" onClick={onAssign}>
            <UserPlus size={16} />
            Asignar miembro
          </button>
        </div>
      </header>

      {error && (
        <div className="gpage-alert"><CircleAlert size={16} /><span>{error}</span></div>
      )}

      <div className="gpage-members-wrap">
        <div className="gpage-members-header">
          <Users size={16} />
          <h2>Miembros ({group.members.length})</h2>
        </div>

        {group.members.length === 0 && (
          <p className="gpage-no-members">Este grupo no tiene miembros asignados.</p>
        )}

        {group.members.map((m) => (
          <div className="gpage-member-row" key={m.userId}>
            <div className="gpage-member-avatar">
              {m.firstName.charAt(0)}{m.lastName.charAt(0)}
            </div>
            <div className="gpage-member-info">
              <strong>{m.firstName} {m.lastName}</strong>
              <span>{m.email}</span>
            </div>
            <select
              className="gpage-role-select"
              value={m.role}
              onChange={(e) => handleRoleChange(m.userId, e.target.value as GroupRole)}
            >
              <option value="LIDER">Lider</option>
              <option value="EDITOR">Editor</option>
            </select>
            <button
              className="gpage-remove-btn"
              type="button"
              title="Remover miembro"
              onClick={() => handleRemove(m.userId)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {modal.kind === 'assign' && (
        <AssignMemberModal
          group={group}
          onClose={() => setModal({ kind: 'closed' })}
          onAssigned={onUpdated}
        />
      )}
      {modal.kind === 'edit' && (
        <GroupFormModal
          title="Editar grupo"
          defaults={{ name: group.name, description: group.description }}
          onClose={() => setModal({ kind: 'closed' })}
          onSave={async (values) => {
            const updated = await updateGroup(group.id, values)
            onUpdated(updated)
            setModal({ kind: 'closed' })
          }}
        />
      )}
    </div>
  )
}

/* ---- Group Form Modal ---- */

function GroupFormModal({
  defaults,
  onClose,
  onSave,
  title,
}: {
  defaults?: { name: string; description: string }
  onClose: () => void
  onSave: (values: GroupForm) => Promise<void>
  title: string
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { formState: { errors }, handleSubmit, register } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: defaults ?? { name: '', description: '' },
  })

  async function onSubmit(values: GroupForm) {
    setSubmitting(true)
    setError(null)
    try {
      await onSave(values)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left"><Network size={18} /><h2>{title}</h2></div>
          <button className="modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {error && <div className="gpage-alert" style={{ marginBottom: 16 }}><CircleAlert size={14} /><span>{error}</span></div>}
          <label className="modal-field">
            <span className="modal-field-label">Nombre</span>
            <input {...register('name')} placeholder="Nombre del grupo" />
            {errors.name && <small className="modal-field-error">{errors.name.message}</small>}
          </label>
          <label className="modal-field">
            <span className="modal-field-label">Descripcion</span>
            <textarea {...register('description')} rows={3} placeholder="Descripcion del grupo (opcional)" />
            {errors.description && <small className="modal-field-error">{errors.description.message}</small>}
          </label>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="modal-btn modal-btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---- Assign Member Modal ---- */

function AssignMemberModal({
  group,
  onClose,
  onAssigned,
}: {
  group: PlanningGroupSummary
  onClose: () => void
  onAssigned: (g: PlanningGroupSummary) => void
}) {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<GroupRole>('EDITOR')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listUsers()
      .then((all) => {
        const memberIds = new Set(group.members.map((m) => m.userId))
        setUsers(all.filter((u) => !memberIds.has(u.id) && u.status === 'ACTIVO'))
      })
      .catch(() => {})
  }, [group])

  async function handleAssign() {
    if (!selectedUserId) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await assignMember(group.id, { userId: selectedUserId, role: selectedRole })
      onAssigned(updated)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al asignar miembro.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left"><UserPlus size={18} /><h2>Asignar miembro</h2></div>
          <button className="modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <p className="modal-hint">Agregar un usuario al grupo <strong>{group.name}</strong></p>
          {error && <div className="gpage-alert" style={{ marginBottom: 0 }}><CircleAlert size={14} /><span>{error}</span></div>}
          <label className="modal-field">
            <span className="modal-field-label">Usuario</span>
            <select
              value={selectedUserId ?? ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value) || null)}
            >
              <option value="">Seleccionar usuario...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
              ))}
            </select>
          </label>
          <label className="modal-field">
            <span className="modal-field-label">Rol en el grupo</span>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as GroupRole)}>
              <option value="EDITOR">Editor</option>
              <option value="LIDER">Lider</option>
            </select>
          </label>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button
              className="modal-btn modal-btn--primary"
              type="button"
              disabled={!selectedUserId || submitting}
              onClick={handleAssign}
            >
              {submitting ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
