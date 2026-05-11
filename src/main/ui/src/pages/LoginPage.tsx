import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, Eye, EyeOff, FileText, KeyRound, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingrese su correo.').email('Correo invalido.'),
  password: z.string().min(1, 'Ingrese su contrasena.'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { user, login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  })

  if (user) return <Navigate to="/" replace />

  async function onSubmit(values: LoginForm) {
    setSubmitting(true)
    setError(null)
    try {
      await login(values)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Credenciales incorrectas.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
        <div className="login-bg-grid" />
      </div>

      <div className="login-container">
        {/* Left panel - branding */}
        <div className="login-branding">
          <div className="login-branding-content">
            <div className="login-logo">
              <div className="login-logo-mark">
                <FileText size={32} strokeWidth={2} />
              </div>
              <div className="login-logo-text">
                <strong>StrategicTI</strong>
                <span>Plan Estrategico de TI</span>
              </div>
            </div>

            <h1 className="login-headline">
              Gestiona tu <span className="login-headline-accent">planificacion</span> estrategica
            </h1>
            <p className="login-tagline">
              Identidad, diagnostico, formulacion y consolidacion en una sola plataforma.
            </p>

            <div className="login-features">
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Analisis FODA, BCG, Porter y PEST</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Cadena de valor y diagnostico interno</span>
              </div>
              <div className="login-feature">
                <div className="login-feature-dot" />
                <span>Seguimiento de avance en tiempo real</span>
              </div>
            </div>
          </div>

          <div className="login-branding-footer">
            <span>2026 StrategicTI. Todos los derechos reservados.</span>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2>Iniciar sesion</h2>
              <p>Ingrese sus credenciales para continuar</p>
            </div>

            {error && (
              <div className="login-alert" role="alert">
                <CircleAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
              <div className="login-field">
                <label htmlFor="login-email" className="login-label">Correo electronico</label>
                <div className={`login-input-wrapper ${errors.email ? 'login-input-wrapper--error' : ''}`}>
                  <Mail size={18} className="login-input-icon" />
                  <input
                    {...register('email')}
                    id="login-email"
                    type="email"
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {errors.email && <small className="login-field-error">{errors.email.message}</small>}
              </div>

              <div className="login-field">
                <label htmlFor="login-password" className="login-label">Contrasena</label>
                <div className={`login-input-wrapper ${errors.password ? 'login-input-wrapper--error' : ''}`}>
                  <KeyRound size={18} className="login-input-icon" />
                  <input
                    {...register('password')}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingrese su contrasena"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <small className="login-field-error">{errors.password.message}</small>}
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="login-spinner" />
                ) : (
                  'Iniciar sesion'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
