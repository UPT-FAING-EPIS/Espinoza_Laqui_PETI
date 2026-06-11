import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, KeyRound, Mail, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const loginSchema = z.object({
  email: z.string().min(1, 'Ingrese su correo electrónico.').email('Correo inválido.'),
  password: z.string().min(1, 'Ingrese su contraseña.'),
})

type LoginForm = z.infer<typeof loginSchema>

const ALERT_VISIBLE_MS = 15000
const ALERT_EXIT_MS = 420

export default function LoginPage() {
  const { user, login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorSequence, setErrorSequence] = useState(0)
  const [alertClosing, setAlertClosing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    handleSubmit,
    register,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  })

  useEffect(() => {
    if (!error) return

    setAlertClosing(false)
    const exitDelay = Math.max(0, ALERT_VISIBLE_MS - ALERT_EXIT_MS)
    const exitTimer = window.setTimeout(() => setAlertClosing(true), exitDelay)
    const closeTimer = window.setTimeout(() => {
      setError(null)
      setAlertClosing(false)
    }, ALERT_VISIBLE_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(closeTimer)
    }
  }, [error, errorSequence])

  if (user) return <Navigate to="/" replace />

  function showError(message: string) {
    setAlertClosing(false)
    setError(message)
    setErrorSequence((current) => current + 1)
  }

  async function onSubmit(values: LoginForm) {
    setSubmitting(true)
    setError(null)
    setAlertClosing(false)
    try {
      await login(values)
    } catch (exception) {
      showError(exception instanceof Error ? exception.message : 'Correo o contraseña incorrectos.')
    } finally {
      setSubmitting(false)
    }
  }

  function onInvalidSubmit() {
    showError('Revise sus credenciales para continuar.')
  }

  return (
    <div className="login-page">
      <div className="login-bg-grid" />

      <div className="login-status-region">
        {error && (
          <div className={`login-alert ${alertClosing ? 'is-leaving' : ''}`} role="alert">
            <XCircle className="login-alert-icon" size={18} strokeWidth={2.4} />
            <span>{error}</span>
          </div>
        )}
      </div>

      <main className="login-stage">
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-key-mark">
            <KeyRound size={34} strokeWidth={2.1} />
          </div>

          <div className="login-form-header">
            <h1 id="login-title">Iniciar sesión</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="login-form" noValidate>
            <div className="login-field">
              <label htmlFor="login-email" className="login-label">Correo electrónico</label>
              <div className="login-input-wrapper">
                <Mail size={18} className="login-input-icon" />
                <input
                  {...register('email')}
                  id="login-email"
                  type="email"
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">Contraseña</label>
              <div className="login-input-wrapper">
                <KeyRound size={18} className="login-input-icon" />
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-toggle-pw"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={submitting}
            >
              {submitting ? (
                <span className="login-spinner" />
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </section>
      </main>

      <footer className="login-system-name">
        <strong>StrategicTI</strong>
        <span>Plan Estratégico de TI</span>
      </footer>
    </div>
  )
}
