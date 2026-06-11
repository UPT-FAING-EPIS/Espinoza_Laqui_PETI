import { CheckCircle2, CircleAlert, Mail, Save, Shield, User } from 'lucide-react'
import { useState } from 'react'
import { updateMyDefaultView } from '../api/authApi'
import { useAuth } from '../context/AuthContext'
import type { DefaultView } from '../types'
import './ProfilePage.css'

const viewLabels: Record<DefaultView, string> = {
  CURRENT_PLAN: 'Plan PETI',
  MY_GROUPS: 'Mis grupos',
  USER_MANAGEMENT: 'Gestion de usuarios',
  GROUP_MANAGEMENT: 'Gestion de grupos',
}

const viewsByRole: Record<string, DefaultView[]> = {
  ADMINISTRADOR: ['CURRENT_PLAN', 'USER_MANAGEMENT', 'GROUP_MANAGEMENT'],
  USUARIO: ['CURRENT_PLAN', 'MY_GROUPS'],
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [selectedView, setSelectedView] = useState<DefaultView>(user?.defaultView ?? 'CURRENT_PLAN')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  const isDirty = selectedView !== (user.defaultView ?? 'CURRENT_PLAN')
  const availableViews = viewsByRole[user.role] ?? []

  async function handleSaveView() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const updated = await updateMyDefaultView({ defaultView: selectedView })
      updateUser(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo actualizar.')
    } finally {
      setSaving(false)
    }
  }

  const statusLabel = user.status === 'ACTIVO' ? 'Activo' : 'Inactivo'
  const roleLabel = user.role === 'ADMINISTRADOR' ? 'Administrador' : 'Usuario'

  return (
    <div className="profile">
      <header className="profile-header">
        <h1>Mi perfil</h1>
        <p className="profile-subtitle">Informacion de tu cuenta y preferencias</p>
      </header>

      <div className="profile-grid">
        {/* User info card */}
        <section className="profile-card">
          <div className="profile-card-header">
            <User size={18} />
            <h2>Datos personales</h2>
          </div>
          <div className="profile-card-body">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="profile-avatar-info">
                <strong>{user.firstName} {user.lastName}</strong>
                <span className={`profile-status profile-status--${user.status.toLowerCase()}`}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="profile-fields">
              <div className="profile-field">
                <Mail size={16} className="profile-field-icon" />
                <div>
                  <span className="profile-field-label">Correo electronico</span>
                  <span className="profile-field-value">{user.email}</span>
                </div>
              </div>
              <div className="profile-field">
                <Shield size={16} className="profile-field-icon" />
                <div>
                  <span className="profile-field-label">Rol del sistema</span>
                  <span className="profile-field-value">{roleLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Default view card */}
        <section className="profile-card">
          <div className="profile-card-header">
            <Save size={18} />
            <h2>Vista predeterminada</h2>
          </div>
          <div className="profile-card-body">
            <p className="profile-view-hint">
              Selecciona la pantalla que se muestra al iniciar sesion.
            </p>

            <div className="profile-view-options">
              {availableViews.map((view) => (
                <label
                  key={view}
                  className={`profile-view-option ${selectedView === view ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="defaultView"
                    value={view}
                    checked={selectedView === view}
                    onChange={() => setSelectedView(view)}
                  />
                  <span className="profile-view-radio" />
                  <span>{viewLabels[view]}</span>
                </label>
              ))}
            </div>

            {error && (
              <div className="profile-alert profile-alert--error">
                <CircleAlert size={14} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="profile-alert profile-alert--success">
                <CheckCircle2 size={14} />
                <span>Vista predeterminada actualizada.</span>
              </div>
            )}

            <button
              type="button"
              className="profile-save-btn"
              disabled={!isDirty || saving}
              onClick={handleSaveView}
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar preferencia'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
