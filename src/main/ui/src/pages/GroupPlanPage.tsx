import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  ChevronLeft,
  CircleAlert,
  FileText,
  Flag,
  ListChecks,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getGroup } from '../api/groupApi'
import {
  createGroupPlan,
  getGroupPlan,
  getGroupPlanIdentity,
  saveGroupPlanIdentity,
} from '../api/planApi'
import { setActivePetiGroupId } from '../session'
import '../App.css'
import './GroupPlanPage.css'
import type { ReactNode } from 'react'
import type { IdentitySectionSummary, PhaseSnapshot, PlanningGroupSummary, PlanSummary, StrategicObjective } from '../types'

const identitySchema = z.object({
  mission: z.string().max(2000, 'Maximo 2000 caracteres.'),
  vision: z.string().max(2000, 'Maximo 2000 caracteres.'),
  valuesText: z.string().max(2000, 'Maximo 2000 caracteres.'),
})

type IdentityForm = z.infer<typeof identitySchema>

const emptyIdentity: IdentityForm = {
  mission: '',
  vision: '',
  valuesText: '',
}

function emptyObjective(): StrategicObjective {
  return { generalObjective: '', specificObjectives: [''] }
}

export default function GroupPlanPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const numericGroupId = Number(groupId)

  const [group, setGroup] = useState<PlanningGroupSummary | null>(null)
  const [plan, setPlan] = useState<PlanSummary | null>(null)
  const [identity, setIdentity] = useState<IdentitySectionSummary | null>(null)
  const [objectives, setObjectives] = useState<StrategicObjective[]>([emptyObjective()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [planMissing, setPlanMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: emptyIdentity,
  })

  const activePhase = useMemo(
    () => plan?.phases.find((phase) => phase.phase === plan.activePhase),
    [plan],
  )

  const load = useCallback(async () => {
    if (!numericGroupId) {
      navigate('/')
      return
    }

    setActivePetiGroupId(numericGroupId)

    setLoading(true)
    setError(null)
    setPlanMissing(false)
    try {
      const nextGroup = await getGroup(numericGroupId)
      setGroup(nextGroup)

      const [nextPlan, nextIdentity] = await Promise.all([
        getGroupPlan(numericGroupId),
        getGroupPlanIdentity(numericGroupId),
      ])

      setPlan(nextPlan)
      setIdentity(nextIdentity)
      reset({
        mission: nextIdentity.mission,
        vision: nextIdentity.vision,
        valuesText: nextIdentity.valuesText,
      })
      setObjectives(nextIdentity.objectives.length > 0 ? nextIdentity.objectives : [emptyObjective()])
    } catch (exception) {
      const message = exception instanceof Error ? exception.message : 'No se pudo cargar el plan.'
      if (message.toLowerCase().includes('aun no tiene un plan')) {
        setPlan(null)
        setIdentity(null)
        setObjectives([emptyObjective()])
        setPlanMissing(true)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, numericGroupId, reset])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreatePlan() {
    if (!numericGroupId) return
    setCreating(true)
    setError(null)
    try {
      await createGroupPlan(numericGroupId)
      await load()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo crear el plan.')
    } finally {
      setCreating(false)
    }
  }

  async function onSubmit(values: IdentityForm) {
    if (!numericGroupId) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...values,
        objectives: normalizeObjectives(objectives),
      }
      const nextIdentity = await saveGroupPlanIdentity(numericGroupId, payload)
      const nextPlan = await getGroupPlan(numericGroupId)
      setIdentity(nextIdentity)
      setPlan(nextPlan)
      reset({
        mission: nextIdentity.mission,
        vision: nextIdentity.vision,
        valuesText: nextIdentity.valuesText,
      })
      setObjectives(nextIdentity.objectives.length > 0 ? nextIdentity.objectives : [emptyObjective()])
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo guardar la identidad.')
    } finally {
      setSaving(false)
    }
  }

  function updateObjective(index: number, value: string) {
    setObjectives((current) =>
      current.map((objective, i) => (i === index ? { ...objective, generalObjective: value } : objective)),
    )
  }

  function updateSpecificObjective(objectiveIndex: number, specificIndex: number, value: string) {
    setObjectives((current) =>
      current.map((objective, i) => {
        if (i !== objectiveIndex) return objective
        return {
          ...objective,
          specificObjectives: objective.specificObjectives.map((specific, j) => (j === specificIndex ? value : specific)),
        }
      }),
    )
  }

  function addObjective() {
    setObjectives((current) => [...current, emptyObjective()])
  }

  function removeObjective(index: number) {
    setObjectives((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length > 0 ? next : [emptyObjective()]
    })
  }

  function addSpecificObjective(objectiveIndex: number) {
    setObjectives((current) =>
      current.map((objective, i) =>
        i === objectiveIndex
          ? { ...objective, specificObjectives: [...objective.specificObjectives, ''] }
          : objective,
      ),
    )
  }

  function removeSpecificObjective(objectiveIndex: number, specificIndex: number) {
    setObjectives((current) =>
      current.map((objective, i) => {
        if (i !== objectiveIndex) return objective
        const nextSpecifics = objective.specificObjectives.filter((_, j) => j !== specificIndex)
        return { ...objective, specificObjectives: nextSpecifics.length > 0 ? nextSpecifics : [''] }
      }),
    )
  }

  const totalProgress = plan?.totalProgress ?? 0
  const backTo = group ? (window.history.length > 1 ? -1 : 0) : 0

  return (
    <div className="peti-page gplan-page">
      <div className="peti-stepper-panel">
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
          {!loading && !plan && <EmptyStepper />}
        </nav>
        <div className="peti-progress-section">
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
      </div>

      <div className="peti-main">
        <header className="page-header">
          <div className="page-header-left">
            <button
              className="gplan-back-btn"
              type="button"
              onClick={() => (backTo === -1 ? navigate(-1) : navigate('/my-groups'))}
            >
              <ChevronLeft size={18} />
              Volver
            </button>
            <div className="breadcrumb">
              <span>PETI</span>
              <span>/</span>
              <span>{group?.name ?? 'Grupo'}</span>
            </div>
            <h1>{activePhase?.title ?? 'Identidad estrategica'}</h1>
            <p className="page-subtitle">{group?.description || 'Plan estrategico de TI del grupo'}</p>
          </div>
          <div className="page-header-right">
            <button className="btn-icon" type="button" onClick={load} title="Actualizar">
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

        {!loading && planMissing && (
          <section className="gplan-empty-card">
            <div className="gplan-empty-icon">
              <FileText size={42} />
            </div>
            <h2>Plan PETI pendiente</h2>
            <p>{group?.name ?? 'Este grupo'} aun no tiene un plan activo.</p>
            <button className="btn btn-primary" type="button" onClick={handleCreatePlan} disabled={creating}>
              <Plus size={16} />
              {creating ? 'Creando...' : 'Crear plan PETI'}
            </button>
          </section>
        )}

        {!loading && plan && (
          <div className="content-grid">
            <form className="form-area" onSubmit={handleSubmit(onSubmit)}>
              <section className="card">
                <div className="card-header">
                  <Building2 size={18} />
                  <h2>Identidad estrategica</h2>
                </div>
                <div className="card-body two-col">
                  <Field label="Mision" error={errors.mission?.message}>
                    <textarea {...register('mission')} rows={4} placeholder="Mision institucional" />
                  </Field>
                  <Field label="Vision" error={errors.vision?.message}>
                    <textarea {...register('vision')} rows={4} placeholder="Vision institucional" />
                  </Field>
                  <Field label="Valores" error={errors.valuesText?.message} wide>
                    <textarea {...register('valuesText')} rows={3} placeholder="Valores separados por lineas o comas" />
                  </Field>
                </div>
              </section>

              <section className="card">
                <div className="card-header gplan-card-header-action">
                  <div className="gplan-card-title">
                    <ListChecks size={18} />
                    <h2>Objetivos</h2>
                  </div>
                  <button className="gplan-inline-btn" type="button" onClick={addObjective}>
                    <Plus size={14} />
                    Agregar
                  </button>
                </div>
                <div className="card-body gplan-objectives">
                  {objectives.map((objective, objectiveIndex) => (
                    <article className="gplan-objective" key={objectiveIndex}>
                      <div className="gplan-objective-head">
                        <Field label={`Objetivo estrategico ${objectiveIndex + 1}`} wide>
                          <textarea
                            rows={2}
                            value={objective.generalObjective}
                            onChange={(event) => updateObjective(objectiveIndex, event.target.value)}
                            placeholder="Objetivo general o estrategico"
                          />
                        </Field>
                        <button
                          className="gplan-remove-btn"
                          type="button"
                          title="Quitar objetivo"
                          onClick={() => removeObjective(objectiveIndex)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="gplan-specific-list">
                        <div className="gplan-specific-title">
                          <Flag size={14} />
                          <span>Objetivos especificos</span>
                        </div>
                        {objective.specificObjectives.map((specific, specificIndex) => (
                          <div className="gplan-specific-row" key={specificIndex}>
                            <input
                              value={specific}
                              onChange={(event) =>
                                updateSpecificObjective(objectiveIndex, specificIndex, event.target.value)
                              }
                              placeholder={`Objetivo especifico ${specificIndex + 1}`}
                            />
                            <button
                              className="gplan-remove-btn"
                              type="button"
                              title="Quitar objetivo especifico"
                              onClick={() => removeSpecificObjective(objectiveIndex, specificIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          className="gplan-link-btn"
                          type="button"
                          onClick={() => addSpecificObjective(objectiveIndex)}
                        >
                          <Plus size={14} />
                          Agregar objetivo especifico
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="form-actions">
                <button className="btn btn-secondary" type="submit" disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar identidad'}
                </button>
              </div>
            </form>

            <aside className="tools-panel">
              <div className="card-header">
                <FileText size={18} />
                <h2>Plan del grupo</h2>
              </div>
              <div className="gplan-side-body">
                <div className="gplan-side-item">
                  <span>Grupo</span>
                  <strong>{group?.name ?? '-'}</strong>
                </div>
                <div className="gplan-side-item">
                  <span>Plan</span>
                  <strong>{identity?.planId ? `#${identity.planId}` : '-'}</strong>
                </div>
                <div className="gplan-side-item">
                  <span>Actualizado</span>
                  <strong>{identity?.updatedAt ? new Date(identity.updatedAt).toLocaleDateString() : '-'}</strong>
                </div>
                <Link className="gplan-side-link" to={group ? `/groups/${group.id}/plan` : '/my-groups'}>
                  <FileText size={16} />
                  Identidad PETI
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

function normalizeObjectives(objectives: StrategicObjective[]) {
  return objectives
    .map((objective) => ({
      generalObjective: objective.generalObjective.trim(),
      specificObjectives: objective.specificObjectives.map((specific) => specific.trim()).filter(Boolean),
    }))
    .filter((objective) => objective.generalObjective || objective.specificObjectives.length > 0)
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

function StepperItem({
  snapshot,
  active,
  last,
}: {
  snapshot: PhaseSnapshot
  active: boolean
  last: boolean
}) {
  const state = snapshot.completed ? 'completed' : snapshot.locked ? 'locked' : active ? 'active' : ''
  return (
    <div className={`step ${state}`}>
      <div className="step-indicator">
        <div className="step-dot">
          {snapshot.completed ? <ListChecks size={16} /> : <FileText size={16} />}
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

function EmptyStepper() {
  return (
    <div className="step active">
      <div className="step-indicator">
        <div className="step-dot">
          <FileText size={16} />
        </div>
      </div>
      <div className="step-content">
        <strong>Plan PETI</strong>
        <span>Pendiente</span>
      </div>
    </div>
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
