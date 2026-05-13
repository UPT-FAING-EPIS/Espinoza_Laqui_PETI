import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  ChevronLeft,
  CheckCircle2,
  CircleAlert,
  FileText,
  Flag,
  GitPullRequest,
  History,
  ListChecks,
  Plus,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getGroup } from '../api/groupApi'
import {
  approvePhaseChangeRequest,
  createGroupPlan,
  createPhaseChangeRequest,
  getGroupPlan,
  getGroupPlanIdentity,
  listPhaseChangeRequests,
  listPhaseVersions,
  rejectPhaseChangeRequest,
  saveGroupPlanIdentity,
  submitPhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import { setActivePetiGroupId } from '../session'
import '../App.css'
import './GroupPlanPage.css'
import type { ReactNode } from 'react'
import type {
  IdentitySectionSummary,
  PhaseChangeRequestSummary,
  PhaseChangeStatus,
  PhaseSnapshot,
  PhaseVersionSummary,
  PlanningGroupSummary,
  PlanSummary,
  StrategicObjective,
  UpdateIdentityPayload,
} from '../types'

const identitySchema = z.object({
  companyName: z.string().max(160, 'Maximo 160 caracteres.'),
  businessLine: z.string().max(160, 'Maximo 160 caracteres.'),
  description: z.string().max(2000, 'Maximo 2000 caracteres.'),
  mission: z.string().max(2000, 'Maximo 2000 caracteres.'),
  vision: z.string().max(2000, 'Maximo 2000 caracteres.'),
  valuesText: z.string().max(2000, 'Maximo 2000 caracteres.'),
})

type IdentityForm = z.infer<typeof identitySchema>

const emptyIdentity: IdentityForm = {
  companyName: '',
  businessLine: '',
  description: '',
  mission: '',
  vision: '',
  valuesText: '',
}

const statusLabels: Record<PhaseChangeStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

function emptyObjective(): StrategicObjective {
  return { generalObjective: '', specificObjectives: [''] }
}

export default function GroupPlanPage() {
  const { user } = useAuth()
  const { groupId } = useParams()
  const navigate = useNavigate()
  const numericGroupId = Number(groupId)

  const [group, setGroup] = useState<PlanningGroupSummary | null>(null)
  const [plan, setPlan] = useState<PlanSummary | null>(null)
  const [identity, setIdentity] = useState<IdentitySectionSummary | null>(null)
  const [phaseChanges, setPhaseChanges] = useState<PhaseChangeRequestSummary[]>([])
  const [phaseVersions, setPhaseVersions] = useState<PhaseVersionSummary[]>([])
  const [objectives, setObjectives] = useState<StrategicObjective[]>([emptyObjective()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)
  const [planMissing, setPlanMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

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
  const identityPhase = useMemo(
    () => plan?.phases.find((phase) => phase.phase === 'IDENTITY'),
    [plan],
  )
  const pendingIdentityRequest = useMemo(
    () => phaseChanges.find((change) => change.status === 'PENDING_APPROVAL') ?? null,
    [phaseChanges],
  )
  const isLeader = useMemo(
    () => group?.members.some((member) => member.userId === user?.id && member.role === 'LIDER') ?? false,
    [group, user],
  )
  const identityCompleted = identityPhase?.completed ?? false
  const workflowBusy = workflowAction !== null
  const phaseStatus = identityCompleted ? 'APPROVED' : pendingIdentityRequest ? 'PENDING_APPROVAL' : 'DRAFT'

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

      const [nextPlan, nextIdentity, nextChanges, nextVersions] = await Promise.all([
        getGroupPlan(numericGroupId),
        getGroupPlanIdentity(numericGroupId),
        listPhaseChangeRequests(numericGroupId, 'IDENTITY'),
        listPhaseVersions(numericGroupId, 'IDENTITY'),
      ])

      setPlan(nextPlan)
      setIdentity(nextIdentity)
      setPhaseChanges(nextChanges)
      setPhaseVersions(nextVersions)
      reset({
        companyName: nextPlan.profile.companyName,
        businessLine: nextPlan.profile.businessLine,
        description: nextPlan.profile.description,
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
        setPhaseChanges([])
        setPhaseVersions([])
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
    if (identityCompleted) {
      setError('La fase de identidad ya fue aprobada. Envie una solicitud de cambio para modificarla.')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const payload = identityPayload(values, objectives)
      const nextIdentity = await saveGroupPlanIdentity(numericGroupId, payload)
      const nextPlan = await getGroupPlan(numericGroupId)
      setIdentity(nextIdentity)
      setPlan(nextPlan)
      reset({
        companyName: nextPlan.profile.companyName,
        businessLine: nextPlan.profile.businessLine,
        description: nextPlan.profile.description,
        mission: nextIdentity.mission,
        vision: nextIdentity.vision,
        valuesText: nextIdentity.valuesText,
      })
      setObjectives(nextIdentity.objectives.length > 0 ? nextIdentity.objectives : [emptyObjective()])
      setNotice('Borrador de identidad guardado.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo guardar la identidad.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendForReview(values: IdentityForm) {
    if (!numericGroupId || !plan) return
    const payload = identityPayload(values, objectives)
    if (!identityReady(payload)) {
      setError('Complete datos de empresa, mision, vision, valores y al menos un objetivo antes de enviar a revision.')
      return
    }

    setWorkflowAction('submit')
    setError(null)
    setNotice(null)
    try {
      const request = await createPhaseChangeRequest(numericGroupId, 'IDENTITY', {
        title: identityCompleted ? 'Actualizar identidad estrategica' : 'Aprobar identidad estrategica',
        description: identityCompleted
          ? 'Propuesta de cambio sobre una fase ya aprobada.'
          : 'Solicitud para aprobar la fase de identidad estrategica.',
        proposedContent: {
          companyName: payload.companyName,
          businessLine: payload.businessLine,
          description: payload.description,
          mission: payload.mission,
          vision: payload.vision,
          valuesText: payload.valuesText,
          objectives: payload.objectives,
        },
        entries: identityChangeEntries(plan, identity, payload),
      })
      await submitPhaseChangeRequest(numericGroupId, 'IDENTITY', request.id)
      await load()
      setNotice('Solicitud enviada a revision del lider.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo enviar la solicitud.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleReview(approved: boolean) {
    if (!numericGroupId || !pendingIdentityRequest) return
    setWorkflowAction(approved ? 'approve' : 'reject')
    setError(null)
    setNotice(null)
    try {
      if (approved) {
        await approvePhaseChangeRequest(numericGroupId, 'IDENTITY', pendingIdentityRequest.id, { comment: '' })
      } else {
        await rejectPhaseChangeRequest(numericGroupId, 'IDENTITY', pendingIdentityRequest.id, { comment: '' })
      }
      await load()
      setNotice(approved ? 'Solicitud aprobada y version oficial registrada.' : 'Solicitud rechazada.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo revisar la solicitud.')
    } finally {
      setWorkflowAction(null)
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
        {notice && (
          <div className="gplan-notice" role="status">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
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
                  <h2>Datos de la empresa</h2>
                </div>
                <div className="card-body two-col">
                  <Field label="Nombre" error={errors.companyName?.message}>
                    <input {...register('companyName')} placeholder="Nombre de la empresa" />
                  </Field>
                  <Field label="Rubro" error={errors.businessLine?.message}>
                    <input {...register('businessLine')} placeholder="Sector o actividad principal" />
                  </Field>
                  <Field label="Descripcion" error={errors.description?.message} wide>
                    <textarea {...register('description')} rows={3} placeholder="Descripcion breve de la organizacion" />
                  </Field>
                </div>
              </section>

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
                <button className="btn btn-secondary" type="submit" disabled={saving || workflowBusy || identityCompleted}>
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar borrador'}
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={workflowBusy || Boolean(pendingIdentityRequest)}
                  onClick={handleSubmit(handleSendForReview)}
                >
                  <Send size={16} />
                  {workflowAction === 'submit' ? 'Enviando...' : 'Enviar a revision'}
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
                <div className="gplan-workflow-summary">
                  <div className="gplan-workflow-title">
                    <GitPullRequest size={16} />
                    <span>Revision de fase</span>
                  </div>
                  <span className={`gplan-status gplan-status--${phaseStatus.toLowerCase()}`}>
                    {statusLabels[phaseStatus]}
                  </span>
                  {pendingIdentityRequest && (
                    <div className="gplan-request-card">
                      <strong>{pendingIdentityRequest.title}</strong>
                      <span>Enviada {formatDate(pendingIdentityRequest.submittedAt ?? pendingIdentityRequest.updatedAt)}</span>
                      {isLeader && (
                        <div className="gplan-review-actions">
                          <button
                            className="gplan-review-btn approve"
                            type="button"
                            disabled={workflowBusy}
                            onClick={() => handleReview(true)}
                            title="Aprobar solicitud"
                          >
                            <ShieldCheck size={14} />
                            Aprobar
                          </button>
                          <button
                            className="gplan-review-btn reject"
                            type="button"
                            disabled={workflowBusy}
                            onClick={() => handleReview(false)}
                            title="Rechazar solicitud"
                          >
                            <XCircle size={14} />
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="gplan-history-block">
                  <div className="gplan-workflow-title">
                    <History size={16} />
                    <span>Versiones</span>
                  </div>
                  {phaseVersions.length === 0 && <p className="gplan-muted">Sin versiones aprobadas.</p>}
                  {phaseVersions.slice(0, 3).map((version) => (
                    <div className="gplan-version-row" key={version.id}>
                      <span>v{version.versionNumber}</span>
                      <strong>{formatDate(version.approvedAt)}</strong>
                    </div>
                  ))}
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

function identityPayload(values: IdentityForm, objectives: StrategicObjective[]): UpdateIdentityPayload {
  return {
    companyName: values.companyName.trim(),
    businessLine: values.businessLine.trim(),
    description: values.description.trim(),
    mission: values.mission.trim(),
    vision: values.vision.trim(),
    valuesText: values.valuesText.trim(),
    objectives: normalizeObjectives(objectives),
  }
}

function normalizeObjectives(objectives: StrategicObjective[]) {
  return objectives
    .map((objective) => ({
      generalObjective: objective.generalObjective.trim(),
      specificObjectives: objective.specificObjectives.map((specific) => specific.trim()).filter(Boolean),
    }))
    .filter((objective) => objective.generalObjective || objective.specificObjectives.length > 0)
}

function identityReady(payload: UpdateIdentityPayload) {
  return Boolean(
    payload.companyName
      && payload.businessLine
      && payload.description
      && payload.mission
      && payload.vision
      && payload.valuesText
      && payload.objectives.some((objective) => objective.generalObjective && objective.specificObjectives.length > 0),
  )
}

function identityChangeEntries(
  plan: PlanSummary,
  identity: IdentitySectionSummary | null,
  payload: UpdateIdentityPayload,
) {
  const currentObjectives = JSON.stringify(identity?.objectives ?? [])
  const nextObjectives = JSON.stringify(payload.objectives)
  return [
    entry('companyName', plan.profile.companyName, payload.companyName),
    entry('businessLine', plan.profile.businessLine, payload.businessLine),
    entry('description', plan.profile.description, payload.description),
    entry('mission', identity?.mission ?? '', payload.mission),
    entry('vision', identity?.vision ?? '', payload.vision),
    entry('valuesText', identity?.valuesText ?? '', payload.valuesText),
    entry('objectives', currentObjectives, nextObjectives),
  ].filter((item) => item.previousValue !== item.proposedValue)
}

function entry(fieldKey: string, previousValue: string, proposedValue: string) {
  return { fieldKey, previousValue, proposedValue }
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
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
