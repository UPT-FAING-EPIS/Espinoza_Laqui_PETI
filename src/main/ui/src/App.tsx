import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  FileDown,
  FileText,
  Globe2,
  Lock,
  PieChart,
  RefreshCcw,
  Save,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { completePhase, getCurrentPlan, saveCompanyProfile } from './api/planApi'
import './App.css'
import type { ReactNode } from 'react'
import type { CompanyProfile, PetiPhase, PhaseSnapshot, PlanSummary } from './types'

const identitySchema = z.object({
  companyName: z.string().min(2, 'Ingrese el nombre de la empresa.').max(160),
  businessLine: z.string().min(2, 'Ingrese el rubro de la empresa.').max(160),
  description: z.string().min(10, 'Ingrese una descripción breve.').max(2000),
  mission: z.string().min(10, 'Ingrese la misión.').max(2000),
  vision: z.string().min(10, 'Ingrese la visión.').max(2000),
  valuesText: z.string().min(3, 'Ingrese los valores.').max(2000),
})

type IdentityForm = z.infer<typeof identitySchema>

const phasesMeta: Record<PetiPhase, { icon: typeof Building2; step: number }> = {
  IDENTITY: { icon: Building2, step: 1 },
  DIAGNOSTICS: { icon: PieChart, step: 2 },
  FORMULATION: { icon: Workflow, step: 3 },
  CONSOLIDATION: { icon: FileDown, step: 4 },
}

const diagnosticModules = [
  { icon: ShieldCheck, title: 'FODA', status: 'Base estratégica', color: '#3b82f6' },
  { icon: Workflow, title: 'Cadena de valor', status: 'Diagnóstico interno', color: '#8b5cf6' },
  { icon: PieChart, title: 'BCG', status: 'Cartera de productos', color: '#f59e0b' },
  { icon: Database, title: 'Porter', status: 'Microentorno', color: '#14b8a6' },
  { icon: Globe2, title: 'PEST', status: 'Macroentorno', color: '#ef4444' },
]

const emptyProfile: CompanyProfile = {
  companyName: '',
  businessLine: '',
  description: '',
  mission: '',
  vision: '',
  valuesText: '',
}

function App() {
  const [plan, setPlan] = useState<PlanSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    formState: { errors, isDirty, isValid },
    handleSubmit,
    register,
    reset,
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    mode: 'onChange',
    defaultValues: emptyProfile,
  })

  const activePhase = useMemo(
    () => plan?.phases.find((phase) => phase.phase === plan.activePhase),
    [plan],
  )

  useEffect(() => {
    refreshPlan()
  }, [])

  async function refreshPlan() {
    setError(null)
    setLoading(true)
    try {
      const nextPlan = await getCurrentPlan()
      setPlan(nextPlan)
      reset(nextPlan.profile)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cargar el plan.')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: IdentityForm) {
    setSaving(true)
    setError(null)
    try {
      const nextPlan = await saveCompanyProfile(values)
      setPlan(nextPlan)
      reset(nextPlan.profile)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  async function closeIdentityPhase() {
    setSaving(true)
    setError(null)
    try {
      const nextPlan = await completePhase('IDENTITY')
      setPlan(nextPlan)
      reset(nextPlan.profile)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo cerrar la fase.')
    } finally {
      setSaving(false)
    }
  }

  const totalProgress = plan?.totalProgress ?? 0

  return (
    <div className="layout">
      {/* ---- SIDEBAR ---- */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-card">
            <div className="brand-mark">
              <FileText size={24} strokeWidth={2} />
            </div>
            <div className="brand-text">
              <strong className="brand-name">StrategicTI</strong>
              <span className="brand-tagline">Plan Estratégico de TI</span>
            </div>
          </div>
          <div className="brand-divider" />
        </div>

        <nav className="stepper" aria-label="Fases del PETI">
          {loading && <StepperSkeleton />}
          {plan?.phases.map((phase, index) => (
            <StepperItem
              key={phase.phase}
              snapshot={phase}
              active={phase.phase === plan.activePhase}
              last={index === plan.phases.length - 1}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="progress-ring-wrapper">
            <svg className="progress-ring" viewBox="0 0 80 80">
              <circle className="progress-ring-bg" cx="40" cy="40" r="34" />
              <circle
                className="progress-ring-fill"
                cx="40"
                cy="40"
                r="34"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - totalProgress / 100)}`}
              />
            </svg>
            <div className="progress-ring-label">
              <strong>{totalProgress}%</strong>
              <span>Avance</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="main-content">
        {/* Page header */}
        <header className="page-header">
          <div className="page-header-left">
            <div className="breadcrumb">
              <span>PETI</span>
              <ChevronRight size={14} />
              <span>{activePhase?.title ?? 'Identidad estratégica'}</span>
            </div>
            <h1>{activePhase?.title ?? 'Identidad estratégica'}</h1>
            <p className="page-subtitle">{activePhase?.description ?? 'Empresa, misión, visión, valores, UEN y objetivos'}</p>
          </div>
          <div className="page-header-right">
            <button className="btn-icon" type="button" onClick={refreshPlan} title="Actualizar">
              <RefreshCcw size={18} />
            </button>
          </div>
        </header>

        {error && (
          <div className="alert" role="alert">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form cards */}
        <div className="content-grid">
          <form className="form-area" onSubmit={handleSubmit(onSubmit)}>
            <section className="card">
              <div className="card-header">
                <Building2 size={18} />
                <h2>Datos de la empresa</h2>
              </div>
              <div className="card-body two-col">
                <Field label="Nombre" error={errors.companyName?.message}>
                  <input {...register('companyName')} placeholder="Nombre de la empresa" />
                </Field>
                <Field label="Rubro" error={errors.businessLine?.message}>
                  <input {...register('businessLine')} placeholder="Sector o actividad principal" />
                </Field>
                <Field label="Descripción" error={errors.description?.message} wide>
                  <textarea {...register('description')} rows={3} placeholder="Descripción breve de la organización" />
                </Field>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <FileText size={18} />
                <h2>Identidad estratégica</h2>
              </div>
              <div className="card-body two-col">
                <Field label="Misión" error={errors.mission?.message}>
                  <textarea {...register('mission')} rows={4} placeholder="Misión institucional" />
                </Field>
                <Field label="Visión" error={errors.vision?.message}>
                  <textarea {...register('vision')} rows={4} placeholder="Visión institucional" />
                </Field>
                <Field label="Valores" error={errors.valuesText?.message} wide>
                  <textarea {...register('valuesText')} rows={3} placeholder="Valores separados por líneas o comas" />
                </Field>
              </div>
            </section>

            <div className="form-actions">
              <button className="btn btn-secondary" type="submit" disabled={saving || !isDirty}>
                <Save size={16} />
                Guardar borrador
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={saving || !isValid || plan?.phases[0]?.completed}
                onClick={closeIdentityPhase}
              >
                <CheckCircle2 size={16} />
                Cerrar fase
              </button>
            </div>
          </form>

          {/* Diagnostic tools dashboard */}
          <section className="tools-panel">
            <div className="card-header">
              <PieChart size={18} />
              <h2>Herramientas de diagnostico</h2>
            </div>
            <div className="tools-grid">
              {diagnosticModules.map((mod) => (
                <article className="tool-card" key={mod.title}>
                  <div className="tool-icon" style={{ '--tool-color': mod.color } as React.CSSProperties}>
                    <mod.icon size={22} />
                  </div>
                  <div className="tool-info">
                    <strong>{mod.title}</strong>
                    <span>{mod.status}</span>
                  </div>
                  <ChevronRight size={16} className="tool-arrow" />
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* ---- Sub-components ---- */

function StepperItem({
  snapshot,
  active,
  last,
}: {
  snapshot: PhaseSnapshot
  active: boolean
  last: boolean
}) {
  const meta = phasesMeta[snapshot.phase]
  const Icon = meta.icon
  const state = snapshot.completed ? 'completed' : snapshot.locked ? 'locked' : active ? 'active' : ''

  return (
    <div className={`step ${state}`}>
      <div className="step-indicator">
        <div className="step-dot">
          {snapshot.completed ? (
            <CheckCircle2 size={16} />
          ) : snapshot.locked ? (
            <Lock size={14} />
          ) : (
            <Icon size={16} />
          )}
        </div>
        {!last && <div className="step-line" />}
      </div>
      <div className="step-content">
        <strong>{snapshot.title}</strong>
        <span>{snapshot.progress}% completado</span>
      </div>
    </div>
  )
}

function Field({
  children,
  error,
  label,
  wide,
}: {
  children: ReactNode
  error?: string
  label: string
  wide?: boolean
}) {
  return (
    <label className={`field ${wide ? 'wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

function StepperSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="step skeleton" key={i}>
          <div className="step-indicator">
            <div className="step-dot" />
            {i < 3 && <div className="step-line" />}
          </div>
          <div className="step-content">
            <strong />
            <span />
          </div>
        </div>
      ))}
    </>
  )
}

export default App
