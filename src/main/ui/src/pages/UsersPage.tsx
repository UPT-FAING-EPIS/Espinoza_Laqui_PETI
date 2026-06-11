import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleAlert,
  KeyRound,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  createUser,
  disableUser,
  enableUser,
  listUsers,
  updateCredentials,
  updateUser,
} from '../api/userApi'
import type { SystemRole, UserSummary } from '../types'
import './UsersPage.css'

/* ---- Schemas ---- */

const createSchema = z.object({
  firstName: z.string().min(1, 'Requerido').max(120),
  lastName: z.string().min(1, 'Requerido').max(120),
  email: z.string().email('Correo invalido').max(180),
  password: z.string().min(8, 'Minimo 8 caracteres').max(120),
  role: z.enum(['ADMINISTRADOR', 'USUARIO']),
})

const editSchema = z.object({
  firstName: z.string().min(1, 'Requerido').max(120),
  lastName: z.string().min(1, 'Requerido').max(120),
  email: z.string().email('Correo invalido').max(180),
  role: z.enum(['ADMINISTRADOR', 'USUARIO']),
})

const credentialsSchema = z.object({
  password: z.string().min(8, 'Minimo 8 caracteres').max(120),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>
type CredentialsForm = z.infer<typeof credentialsSchema>

type ModalState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; user: UserSummary }
  | { kind: 'credentials'; user: UserSummary }

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' })

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    listUsers()
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar usuarios.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleToggleStatus(u: UserSummary) {
    try {
      const updated = u.status === 'ACTIVO' ? await disableUser(u.id) : await enableUser(u.id)
      setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado.')
    }
  }

  return (
    <div className="upage">
      <header className="upage-header">
        <div>
          <h1>Gestion de usuarios</h1>
          <p className="upage-subtitle">Administrar cuentas del sistema</p>
        </div>
        <button className="upage-add-btn" type="button" onClick={() => setModal({ kind: 'create' })}>
          <Plus size={16} />
          Nuevo usuario
        </button>
      </header>

      {error && (
        <div className="upage-alert">
          <CircleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="upage-table-wrap">
        <table className="upage-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr className="upage-skeleton-row" key={i}>
                <td><div className="upage-skel" /></td>
                <td><div className="upage-skel" /></td>
                <td><div className="upage-skel upage-skel--sm" /></td>
                <td><div className="upage-skel upage-skel--sm" /></td>
                <td><div className="upage-skel upage-skel--sm" /></td>
              </tr>
            ))}
            {!loading && users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="upage-user-cell">
                    <div className="upage-mini-avatar">
                      {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                    </div>
                    <span>{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`upage-badge upage-badge--${u.role.toLowerCase()}`}>
                    {u.role === 'ADMINISTRADOR' ? 'Admin' : 'Usuario'}
                  </span>
                </td>
                <td>
                  <span className={`upage-status upage-status--${u.status.toLowerCase()}`}>
                    {u.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="upage-actions">
                    <button
                      className="upage-act-btn"
                      title="Editar"
                      type="button"
                      onClick={() => setModal({ kind: 'edit', user: u })}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="upage-act-btn"
                      title="Cambiar contrasena"
                      type="button"
                      onClick={() => setModal({ kind: 'credentials', user: u })}
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      className={`upage-act-btn ${u.status === 'ACTIVO' ? 'upage-act-btn--danger' : 'upage-act-btn--success'}`}
                      title={u.status === 'ACTIVO' ? 'Deshabilitar' : 'Habilitar'}
                      type="button"
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.status === 'ACTIVO' ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal.kind === 'create' && (
        <CreateModal
          onClose={() => setModal({ kind: 'closed' })}
          onCreated={(u) => { setUsers((prev) => [...prev, u]); setModal({ kind: 'closed' }) }}
        />
      )}
      {modal.kind === 'edit' && (
        <EditModal
          user={modal.user}
          onClose={() => setModal({ kind: 'closed' })}
          onUpdated={(u) => { setUsers((prev) => prev.map((p) => (p.id === u.id ? u : p))); setModal({ kind: 'closed' }) }}
        />
      )}
      {modal.kind === 'credentials' && (
        <CredentialsModal
          user={modal.user}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </div>
  )
}

/* ---- Create Modal ---- */

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: UserSummary) => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { formState: { errors }, handleSubmit, register } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'USUARIO' },
  })

  async function onSubmit(values: CreateForm) {
    setSubmitting(true)
    setError(null)
    try {
      const created = await createUser(values)
      onCreated(created)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <Users size={18} />
            <h2>Nuevo usuario</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {error && <div className="upage-alert" style={{ marginBottom: 16 }}><CircleAlert size={14} /><span>{error}</span></div>}
          <div className="modal-grid">
            <ModalField label="Nombre" error={errors.firstName?.message}>
              <input {...register('firstName')} placeholder="Nombre" />
            </ModalField>
            <ModalField label="Apellido" error={errors.lastName?.message}>
              <input {...register('lastName')} placeholder="Apellido" />
            </ModalField>
          </div>
          <ModalField label="Correo" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="correo@empresa.com" />
          </ModalField>
          <ModalField label="Contrasena" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Minimo 8 caracteres" />
          </ModalField>
          <ModalField label="Rol" error={errors.role?.message}>
            <select {...register('role')}>
              <option value="USUARIO">Usuario</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </ModalField>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="modal-btn modal-btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---- Edit Modal ---- */

function EditModal({ user, onClose, onUpdated }: { user: UserSummary; onClose: () => void; onUpdated: (u: UserSummary) => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { formState: { errors }, handleSubmit, register } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role as SystemRole },
  })

  async function onSubmit(values: EditForm) {
    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateUser(user.id, values)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left"><Pencil size={18} /><h2>Editar usuario</h2></div>
          <button className="modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          {error && <div className="upage-alert" style={{ marginBottom: 16 }}><CircleAlert size={14} /><span>{error}</span></div>}
          <div className="modal-grid">
            <ModalField label="Nombre" error={errors.firstName?.message}>
              <input {...register('firstName')} />
            </ModalField>
            <ModalField label="Apellido" error={errors.lastName?.message}>
              <input {...register('lastName')} />
            </ModalField>
          </div>
          <ModalField label="Correo" error={errors.email?.message}>
            <input {...register('email')} type="email" />
          </ModalField>
          <ModalField label="Rol" error={errors.role?.message}>
            <select {...register('role')}>
              <option value="USUARIO">Usuario</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </ModalField>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="modal-btn modal-btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---- Credentials Modal ---- */

function CredentialsModal({ user, onClose }: { user: UserSummary; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { formState: { errors }, handleSubmit, register, reset } = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
  })

  async function onSubmit(values: CredentialsForm) {
    setSubmitting(true)
    setError(null)
    try {
      await updateCredentials(user.id, values)
      setSuccess(true)
      reset()
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar contrasena.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left"><KeyRound size={18} /><h2>Cambiar contrasena</h2></div>
          <button className="modal-close" type="button" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="modal-body">
          <p className="modal-hint">Cambiar contrasena de <strong>{user.firstName} {user.lastName}</strong></p>
          {error && <div className="upage-alert" style={{ marginBottom: 16 }}><CircleAlert size={14} /><span>{error}</span></div>}
          {success && <div className="upage-alert upage-alert--success" style={{ marginBottom: 16 }}><span>Contrasena actualizada.</span></div>}
          <ModalField label="Nueva contrasena" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="Minimo 8 caracteres" />
          </ModalField>
          <div className="modal-actions">
            <button className="modal-btn modal-btn--secondary" type="button" onClick={onClose}>Cancelar</button>
            <button className="modal-btn modal-btn--primary" type="submit" disabled={submitting}>
              {submitting ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---- Shared ---- */

function ModalField({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return (
    <label className="modal-field">
      <span className="modal-field-label">{label}</span>
      {children}
      {error && <small className="modal-field-error">{error}</small>}
    </label>
  )
}
