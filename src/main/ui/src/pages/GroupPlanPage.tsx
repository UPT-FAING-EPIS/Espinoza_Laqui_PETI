import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  FileText,
  Flag,
  GitPullRequest,
  History,
  ListChecks,
  PencilLine,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getGroup } from '../api/groupApi'
import {
  approvePhaseChangeRequest,
  createGroupPlan,
  createPhaseChangeRequest,
  discardPhaseChangeRequest,
  getGroupPlan,
  getGroupPlanIdentity,
  listPhaseChangeRequests,
  listPhaseVersions,
  rejectPhaseChangeRequest,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import { setActivePetiGroupId } from '../session'
import { DiagnosticsWorkspace } from './DiagnosticsWorkspace'
import '../App.css'
import './GroupPlanPage.css'
import type { ReactNode } from 'react'
import type {
  IdentitySectionSummary,
  PetiPhase,
  PhaseChangeEntry,
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
  const [creating, setCreating] = useState(false)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<PhaseVersionSummary | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<PetiPhase | null>(null)
  const [overviewOpen, setOverviewOpen] = useState(false)
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
  const selectedPhaseKey = selectedPhase ?? plan?.activePhase ?? 'IDENTITY'
  const selectedPhaseSnapshot = useMemo(
    () => plan?.phases.find((phase) => phase.phase === selectedPhaseKey) ?? activePhase,
    [activePhase, plan, selectedPhaseKey],
  )
  const identityPhase = useMemo(
    () => plan?.phases.find((phase) => phase.phase === 'IDENTITY'),
    [plan],
  )
  const pendingIdentityRequest = useMemo(
    () => phaseChanges.find((change) => change.status === 'PENDING_APPROVAL') ?? null,
    [phaseChanges],
  )
  const draftIdentityRequest = useMemo(
    () => phaseChanges.find((change) => change.status === 'DRAFT' && change.createdByUserId === user?.id) ?? null,
    [phaseChanges, user?.id],
  )
  const isLeader = useMemo(
    () => group?.members.some((member) => member.userId === user?.id && member.role === 'LIDER') ?? false,
    [group, user],
  )
  const identityCompleted = identityPhase?.completed ?? false
  const workflowBusy = workflowAction !== null
  const phaseStatus = pendingIdentityRequest
    ? 'PENDING_APPROVAL'
    : draftIdentityRequest
      ? 'DRAFT'
      : identityCompleted ? 'APPROVED' : 'DRAFT'

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
      const editableDraft = nextChanges.find(
        (change) => change.status === 'DRAFT' && change.createdByUserId === user?.id,
      )
      const formPayload = editableDraft
        ? identityPayloadFromContent(editableDraft.proposedContent)
        : identityPayloadFromCurrent(nextPlan, nextIdentity)
      reset({
        companyName: formPayload.companyName,
        businessLine: formPayload.businessLine,
        description: formPayload.description,
        mission: formPayload.mission,
        vision: formPayload.vision,
        valuesText: formPayload.valuesText,
      })
      setObjectives(formPayload.objectives.length > 0 ? formPayload.objectives : [emptyObjective()])
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
  }, [navigate, numericGroupId, reset, user?.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!plan) return

    setSelectedPhase((current) => {
      if (!current) return plan.activePhase
      const snapshot = plan.phases.find((phase) => phase.phase === current)
      return snapshot && canOpenPhase(snapshot, plan.activePhase) ? current : plan.activePhase
    })
  }, [plan])

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

  async function handleSendForReview(values: IdentityForm) {
    if (!numericGroupId || !plan) return
    if (pendingIdentityRequest) {
      setError('Ya existe una solicitud pendiente para esta fase. Espere la revision del lider.')
      return
    }
    const payload = identityPayload(values, objectives)
    if (!identityReady(payload)) {
      setError('Complete datos de empresa, mision, vision, valores y al menos un objetivo antes de enviar a revision.')
      return
    }
    const entries = identityChangeEntries(plan, identity, payload)
    if (identityCompleted && entries.length === 0) {
      setError('No hay cambios para enviar a revision.')
      return
    }

    setWorkflowAction('submit')
    setError(null)
    setNotice(null)
    try {
      const requestPayload = identityChangeRequestPayload(
        payload,
        entries,
        identityCompleted ? 'Actualizar identidad estrategica' : 'Aprobar identidad estrategica',
      )
      const request = draftIdentityRequest
        ? await updatePhaseChangeRequest(numericGroupId, 'IDENTITY', draftIdentityRequest.id, requestPayload)
        : await createPhaseChangeRequest(numericGroupId, 'IDENTITY', requestPayload)
      await submitPhaseChangeRequest(numericGroupId, 'IDENTITY', request.id)
      await load()
      setNotice('Solicitud enviada a revision del lider.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo enviar la solicitud.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleSubmitDraft(requestId: number) {
    if (!numericGroupId) return
    setWorkflowAction(`submit-${requestId}`)
    setError(null)
    setNotice(null)
    try {
      await submitPhaseChangeRequest(numericGroupId, 'IDENTITY', requestId)
      await load()
      setNotice('Solicitud enviada a revision del lider.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo enviar el borrador.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleDiscardDraft(requestId: number) {
    if (!numericGroupId) return
    setWorkflowAction(`discard-${requestId}`)
    setError(null)
    setNotice(null)
    try {
      await discardPhaseChangeRequest(numericGroupId, 'IDENTITY', requestId)
      setPhaseChanges((current) => current.filter((change) => change.id !== requestId))
      setNotice('Borrador descartado.')
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo descartar el borrador.')
    } finally {
      setWorkflowAction(null)
    }
  }

  function handleLoadContentInEditor(payload: UpdateIdentityPayload, sourceLabel: string) {
    setError(null)
    setNotice(
      pendingIdentityRequest
        ? `Contenido de ${sourceLabel} cargado en el editor. Hay una solicitud pendiente antes de guardar nuevos cambios.`
        : `Contenido de ${sourceLabel} cargado en el editor. Guarde el borrador o envielo a revision.`,
    )
    reset({
      companyName: payload.companyName,
      businessLine: payload.businessLine,
      description: payload.description,
      mission: payload.mission,
      vision: payload.vision,
      valuesText: payload.valuesText,
    })
    setObjectives(payload.objectives.length > 0 ? payload.objectives : [emptyObjective()])
    setSelectedVersion(null)
    setOverviewOpen(false)
  }

  function openPlanOverview(version: PhaseVersionSummary | null = null) {
    setError(null)
    setSelectedVersion(version)
    setOverviewOpen(true)
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

  const viewingPreviousPhase = Boolean(
    plan
      && selectedPhaseSnapshot
      && selectedPhaseSnapshot.phase !== plan.activePhase
      && selectedPhaseSnapshot.completed,
  )
  const selectedPhaseTitle = selectedPhaseSnapshot?.title ?? activePhase?.title ?? 'Identidad estrategica'
  const selectedPhaseSubtitle = viewingPreviousPhase
    ? 'Etapa aprobada. Puedes revisarla y proponer ajustes mediante el flujo de revision.'
    : group?.description || 'Plan estrategico de TI del grupo'
  const showIdentityWorkspace = Boolean(!loading && plan && selectedPhaseKey === 'IDENTITY')
  const showDiagnosticsWorkspace = Boolean(!loading && plan && identityCompleted && selectedPhaseKey === 'DIAGNOSTICS')
  const showUnavailablePhase = Boolean(
    !loading
      && plan
      && !planMissing
      && !showIdentityWorkspace
      && !showDiagnosticsWorkspace,
  )

  return (
    <div className="peti-page gplan-page">
      <div className="peti-stepper-panel">
        <span className="peti-phase-label">Fases</span>
        <nav className="stepper" aria-label="Fases del PETI">
          {loading && <StepperSkeleton />}
          {plan?.phases.map((phase, index) => (
            <StepperItem
              key={phase.phase}
              snapshot={phase}
              active={phase.phase === plan.activePhase}
              selected={phase.phase === selectedPhaseKey}
              canOpen={canOpenPhase(phase, plan.activePhase)}
              last={index === plan.phases.length - 1}
              onSelect={() => setSelectedPhase(phase.phase)}
            />
          ))}
          {!loading && !plan && <EmptyStepper />}
        </nav>
      </div>

      <div className="peti-main">
        <header className="page-header">
          <div className="page-header-left">
            <div className="gplan-title-row">
              <h1>{selectedPhaseTitle}</h1>
              {viewingPreviousPhase && <span className="gplan-phase-pill">Etapa anterior</span>}
            </div>
            <p className="page-subtitle">{selectedPhaseSubtitle}</p>
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

        {showDiagnosticsWorkspace && plan && (
          <DiagnosticsWorkspace
            group={group}
            groupId={numericGroupId}
            isLeader={isLeader}
            onError={setError}
            onNotice={setNotice}
            onPlanRefresh={load}
            plan={plan}
          />
        )}

        {showIdentityWorkspace && (
          <div className="content-grid">
            <div className="form-area">
              <section className="card gplan-plan-summary-card">
                <div className="card-header">
                  <FileText size={18} />
                  <h2>Plan del grupo</h2>
                </div>
                <div className="gplan-plan-summary-grid">
                  <DashboardMetric label="Grupo" value={group?.name ?? '-'} />
                  <DashboardMetric label="Plan" value={identity?.planId ? `#${identity.planId}` : '-'} />
                  <DashboardMetric
                    label="Actualizado"
                    value={identity?.updatedAt ? new Date(identity.updatedAt).toLocaleDateString() : '-'}
                  />
                </div>
              </section>

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
            </div>

            <aside className="tools-panel">
              <div className="card-header">
                <GitPullRequest size={18} />
                <h2>Control de fase</h2>
              </div>
              <div className="gplan-side-body">
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
                  {!pendingIdentityRequest && draftIdentityRequest && (
                    <div className="gplan-request-card">
                      <strong>{draftIdentityRequest.title}</strong>
                      <span>Borrador actualizado {formatDate(draftIdentityRequest.updatedAt)}</span>
                      <div className="gplan-review-actions">
                        <button
                          className="gplan-review-btn submit"
                          type="button"
                          disabled={workflowBusy}
                          onClick={() => handleSubmitDraft(draftIdentityRequest.id)}
                          title="Enviar borrador a revision"
                        >
                          <Send size={14} />
                          {workflowAction === `submit-${draftIdentityRequest.id}` ? 'Enviando...' : 'Enviar'}
                        </button>
                        <button
                          className="gplan-review-btn discard"
                          type="button"
                          disabled={workflowBusy}
                          onClick={() => handleDiscardDraft(draftIdentityRequest.id)}
                          title="Descartar borrador"
                        >
                          <Trash2 size={14} />
                          {workflowAction === `discard-${draftIdentityRequest.id}` ? '...' : 'Descartar'}
                        </button>
                      </div>
                    </div>
                  )}
                  {!pendingIdentityRequest && !draftIdentityRequest && (
                    <div className="gplan-request-card">
                      <strong>{identityCompleted ? 'Cambios sin enviar' : 'Identidad pendiente de revision'}</strong>
                      <span>
                        {identityCompleted
                          ? 'Envie el formulario actual al lider cuando quiera proponer cambios.'
                          : 'Envie la identidad al lider cuando el formulario este completo.'}
                      </span>
                      <div className="gplan-review-actions single">
                        <button
                          className="gplan-review-btn submit"
                          type="button"
                          disabled={workflowBusy}
                          onClick={handleSubmit(handleSendForReview)}
                          title="Enviar a revision"
                        >
                          <Send size={14} />
                          {workflowAction === 'submit' ? 'Enviando...' : 'Enviar a revision'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="gplan-history-block">
                  <div className="gplan-workflow-title">
                    <History size={16} />
                    <span>Versiones de identidad</span>
                  </div>
                  <button className="gplan-overview-card" type="button" onClick={() => openPlanOverview(null)}>
                    <FileText size={16} />
                    <span>
                      <strong>Actual</strong>
                      <small>Contenido actual - {formatDate(plan?.updatedAt)}</small>
                    </span>
                  </button>
                  {phaseVersions.length === 0 && <p className="gplan-muted">Sin versiones aprobadas para identidad.</p>}
                  {phaseVersions.map((version) => (
                    <button
                      className="gplan-overview-card"
                      key={version.id}
                      type="button"
                      onClick={() => openPlanOverview(version)}
                    >
                      <FileText size={16} />
                      <span>
                        <strong>v{version.versionNumber}</strong>
                        <small>
                          {formatDate(version.approvedAt)} - {userNameById(group, version.createdByUserId)}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {showUnavailablePhase && (
          <PhasePlaceholder
            phase={selectedPhaseSnapshot}
            activePhase={activePhase}
          />
        )}

        {overviewOpen && plan && (
          <PlanOverviewModal
            group={group}
            plan={plan}
            identity={identity}
            selectedVersion={selectedVersion}
            onClose={() => setOverviewOpen(false)}
            onLoadContent={handleLoadContentInEditor}
          />
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

function identityChangeRequestPayload(
  payload: UpdateIdentityPayload,
  entries: PhaseChangeEntry[],
  title: string,
) {
  return {
    title,
    description: title.startsWith('Actualizar')
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
    entries,
  }
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

function identityPayloadFromContent(content: Record<string, unknown>): UpdateIdentityPayload {
  return {
    companyName: textValue(content.companyName),
    businessLine: textValue(content.businessLine),
    description: textValue(content.description),
    mission: textValue(content.mission),
    vision: textValue(content.vision),
    valuesText: textValue(content.valuesText),
    objectives: objectiveValues(content.objectives),
  }
}

function identityPayloadFromCurrent(
  plan: PlanSummary,
  identity: IdentitySectionSummary | null,
): UpdateIdentityPayload {
  return {
    companyName: plan.profile.companyName,
    businessLine: plan.profile.businessLine,
    description: plan.profile.description,
    mission: identity?.mission ?? plan.profile.mission,
    vision: identity?.vision ?? plan.profile.vision,
    valuesText: identity?.valuesText ?? plan.profile.valuesText,
    objectives: identity?.objectives ?? plan.objectives,
  }
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function objectiveValues(value: unknown): StrategicObjective[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    .map((item) => ({
      generalObjective: textValue(item.generalObjective),
      specificObjectives: Array.isArray(item.specificObjectives)
        ? item.specificObjectives.map(textValue).filter(Boolean)
        : [],
    }))
    .filter((objective) => objective.generalObjective || objective.specificObjectives.length > 0)
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

function PlanOverviewModal({
  group,
  identity,
  onClose,
  onLoadContent,
  plan,
  selectedVersion,
}: {
  group: PlanningGroupSummary | null
  identity: IdentitySectionSummary | null
  onClose: () => void
  onLoadContent: (payload: UpdateIdentityPayload, sourceLabel: string) => void
  plan: PlanSummary
  selectedVersion: PhaseVersionSummary | null
}) {
  const payload = selectedVersion
    ? identityPayloadFromContent(selectedVersion.content)
    : identityPayloadFromCurrent(plan, identity)
  const createdBy = selectedVersion ? userNameById(group, selectedVersion.createdByUserId) : '-'
  const approvedBy = selectedVersion ? userNameById(group, selectedVersion.approvedByUserId) : '-'

  return (
    <div className="gplan-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="plan-overview-title">
      <section className="gplan-preview-modal">
        <header className="gplan-preview-header">
          <div>
            <span className="gplan-preview-kicker">Mini dashboard</span>
            <h2 id="plan-overview-title">Resumen de identidad</h2>
            <p>{group?.name ?? 'Plan del grupo'} - Identidad estrategica</p>
          </div>
          <button className="btn-icon" type="button" onClick={onClose} title="Cerrar">
            <XCircle size={18} />
          </button>
        </header>

        <div className="gplan-preview-body">
          <section className="gplan-preview-focus">
            <div className="gplan-preview-focus-head">
              <div>
                <span className="gplan-preview-kicker">
                  {selectedVersion ? 'Version oficial' : 'Contenido actual'}
                </span>
                <h3>
                  {selectedVersion
                    ? `Identidad PETI v${selectedVersion.versionNumber}`
                    : 'Identidad PETI actual'}
                </h3>
              </div>
              {selectedVersion && (
                <strong>
                  Propuso {createdBy} / aprobo {approvedBy}
                </strong>
              )}
            </div>
            <IdentityPreviewContent payload={payload} />
          </section>
        </div>

        <footer className="gplan-preview-actions">
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Cerrar
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => onLoadContent(payload, selectedVersion ? `v${selectedVersion.versionNumber}` : 'la version actual')}
          >
            <PencilLine size={16} />
            Cargar en editor
          </button>
        </footer>
      </section>
    </div>
  )
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gplan-dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function userNameById(group: PlanningGroupSummary | null, userId?: number | null) {
  if (!userId) return '-'
  const member = group?.members.find((item) => item.userId === userId)
  return member ? `${member.firstName} ${member.lastName}` : `Usuario #${userId}`
}

function IdentityPreviewContent({ payload }: { payload: UpdateIdentityPayload }) {
  return (
    <div className="gplan-preview-sections">
      <section>
        <h3>Datos de empresa</h3>
        <PreviewItem label="Nombre" value={payload.companyName} />
        <PreviewItem label="Rubro" value={payload.businessLine} />
        <PreviewItem label="Descripcion" value={payload.description} multiline />
      </section>
      <section>
        <h3>Identidad estrategica</h3>
        <PreviewItem label="Mision" value={payload.mission} multiline />
        <PreviewItem label="Vision" value={payload.vision} multiline />
        <PreviewItem label="Valores" value={payload.valuesText} multiline />
      </section>
      <section className="gplan-preview-objectives">
        <h3>Objetivos</h3>
        {payload.objectives.length === 0 && <p className="gplan-muted">Sin objetivos registrados.</p>}
        {payload.objectives.map((objective, index) => (
          <article key={`${objective.generalObjective}-${index}`}>
            <strong>{objective.generalObjective || `Objetivo ${index + 1}`}</strong>
            {objective.specificObjectives.length > 0 && (
              <ul>
                {objective.specificObjectives.map((specific, specificIndex) => (
                  <li key={`${specific}-${specificIndex}`}>{specific}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}

function PreviewItem({
  label,
  multiline,
  value,
}: {
  label: string
  multiline?: boolean
  value: string
}) {
  return (
    <div className={`gplan-preview-item ${multiline ? 'multiline' : ''}`}>
      <span>{label}</span>
      <p>{value || '-'}</p>
    </div>
  )
}

function canOpenPhase(snapshot: PhaseSnapshot, activePhase: PetiPhase) {
  return snapshot.completed || snapshot.phase === activePhase || !snapshot.locked
}

function PhasePlaceholder({
  activePhase,
  phase,
}: {
  activePhase?: PhaseSnapshot
  phase?: PhaseSnapshot
}) {
  const locked = phase?.locked && !phase.completed && phase.phase !== activePhase?.phase

  return (
    <section className="gplan-empty-card gplan-phase-placeholder">
      <div className="gplan-empty-icon">
        <FileText size={42} />
      </div>
      <h2>{phase?.title ?? 'Etapa PETI'}</h2>
      <p>
        {locked
          ? 'Esta etapa todavia depende de aprobar las fases anteriores.'
          : 'Esta etapa ya esta disponible en el flujo, pero su pantalla se implementara en una siguiente iteracion.'}
      </p>
      {activePhase && (
        <span className="gplan-phase-helper">
          Fase activa actual: {activePhase.title}
        </span>
      )}
    </section>
  )
}

function StepperItem({
  active,
  canOpen,
  last,
  onSelect,
  selected,
  snapshot,
}: {
  active: boolean
  canOpen: boolean
  last: boolean
  onSelect: () => void
  selected: boolean
  snapshot: PhaseSnapshot
}) {
  const state = [
    snapshot.completed ? 'completed' : '',
    active ? 'active' : '',
    selected ? 'selected' : '',
    canOpen ? '' : 'locked',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={`step ${state}`}
      type="button"
      disabled={!canOpen}
      onClick={onSelect}
      title={canOpen ? `Abrir ${snapshot.title}` : `${snapshot.title} bloqueada`}
    >
      <div className="step-indicator">
        <div className="step-dot">
          {snapshot.completed ? <ListChecks size={16} /> : <FileText size={16} />}
        </div>
        {!last && <div className="step-line" />}
      </div>
      <div className="step-content">
        <strong>{snapshot.title}</strong>
      </div>
    </button>
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
