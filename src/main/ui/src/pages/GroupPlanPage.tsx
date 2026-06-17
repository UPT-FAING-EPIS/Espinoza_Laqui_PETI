import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CheckCircle2,
  CircleAlert,
  FileDown,
  FileText,
  Flag,
  GitPullRequest,
  History,
  ListChecks,
  PencilLine,
  Plus,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { getGroup } from '../api/groupApi'
import {
  createGroupPlan,
  createPhaseChangeRequest,
  getGroupPlan,
  getGroupPlanIdentity,
  listPhaseChangeRequests,
  listPhaseVersions,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import { setActivePetiGroupId } from '../session'
import { DiagnosticsWorkspace } from './DiagnosticsWorkspace'
import { FormulationWorkspace } from './FormulationWorkspace'
import '../App.css'
import './GroupPlanPage.css'
import type { ReactNode } from 'react'
import type {
  IdentitySectionSummary,
  PetiPhase,
  PhaseChangeEntry,
  PhaseChangeRequestSummary,
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
    setValue,
    watch,
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: emptyIdentity,
  })
  const valuesText = watch('valuesText')
  const identityValues = useMemo(() => identityValuesFromText(valuesText), [valuesText])

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
  const diagnosticsPhase = useMemo(
    () => plan?.phases.find((phase) => phase.phase === 'DIAGNOSTICS'),
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
  const identityCompleted = identityPhase?.completed ?? false
  const diagnosticsCompleted = diagnosticsPhase?.completed ?? false
  const workflowBusy = workflowAction !== null

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

  function handleLoadContentInEditor(payload: UpdateIdentityPayload, sourceLabel: string) {
    setError(null)
    setNotice(
      pendingIdentityRequest
        ? `Contenido de ${sourceLabel} cargado en el editor. Hay una solicitud pendiente antes de enviar nuevos cambios.`
        : `Contenido de ${sourceLabel} cargado en el editor. Envielo a revision cuando este listo.`,
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

  function updateIdentityValues(values: string[]) {
    setValue('valuesText', values.join('\n'), { shouldDirty: true, shouldValidate: true })
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
  const showFormulationWorkspace = Boolean(!loading && plan && diagnosticsCompleted && selectedPhaseKey === 'FORMULATION')
  const showUnavailablePhase = Boolean(
    !loading
      && plan
      && !planMissing
      && !showIdentityWorkspace
      && !showDiagnosticsWorkspace
      && !showFormulationWorkspace
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
          <div className="page-header-right">
            <Link className="btn btn-secondary" to={`/groups/${numericGroupId}/plan/report`}>
              <FileDown size={16} />
              Informe PDF
            </Link>
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
            onError={setError}
            onNotice={setNotice}
            plan={plan}
          />
        )}

        {showFormulationWorkspace && plan && (
          <FormulationWorkspace
            group={group}
            groupId={numericGroupId}
            onError={setError}
            onNotice={setNotice}
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
                  <div className="field wide">
                    <span className="field-label">Valores</span>
                    <ValueListEditor values={identityValues} onChange={updateIdentityValues} />
                    <input type="hidden" {...register('valuesText')} />
                    {errors.valuesText?.message && <small className="field-error">{errors.valuesText.message}</small>}
                  </div>
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
                  {pendingIdentityRequest && (
                    <div className="gplan-request-card">
                      <strong>{pendingIdentityRequest.title}</strong>
                      <span>Enviada {formatDate(pendingIdentityRequest.submittedAt ?? pendingIdentityRequest.updatedAt)}</span>
                      <span>Disponible para revision en Solicitudes.</span>
                    </div>
                  )}
                  {!pendingIdentityRequest && draftIdentityRequest && (
                    <div className="gplan-request-card">
                      <strong>{draftIdentityRequest.title}</strong>
                      <span>Borrador actualizado {formatDate(draftIdentityRequest.updatedAt)}</span>
                      <span>Use Enviar a revision para confirmar la propuesta.</span>
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
    valuesText: cleanIdentityValuesText(values.valuesText),
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
  const current = normalizeIdentityPayload(identityPayloadFromCurrent(plan, identity))
  const next = normalizeIdentityPayload(payload)
  return [
    entry('companyName', current.companyName, next.companyName),
    entry('businessLine', current.businessLine, next.businessLine),
    entry('description', current.description, next.description),
    entry('mission', current.mission, next.mission),
    entry('vision', current.vision, next.vision),
    entry('valuesText', current.valuesText, next.valuesText),
    entry('objectives', objectivesComparisonValue(current.objectives), objectivesComparisonValue(next.objectives)),
  ].filter((item) => item.previousValue !== item.proposedValue)
}

function entry(fieldKey: string, previousValue: string, proposedValue: string) {
  return { fieldKey, previousValue, proposedValue }
}

function normalizeIdentityPayload(payload: UpdateIdentityPayload): UpdateIdentityPayload {
  return {
    companyName: payload.companyName.trim(),
    businessLine: payload.businessLine.trim(),
    description: payload.description.trim(),
    mission: payload.mission.trim(),
    vision: payload.vision.trim(),
    valuesText: cleanIdentityValuesText(payload.valuesText),
    objectives: normalizeObjectives(payload.objectives),
  }
}

function identityValuesFromText(value?: string | null) {
  const source = value ?? ''
  const parts = source.includes('\n') ? source.split(/\r?\n/) : source.split(',')
  return parts.length > 0 ? parts.map((item) => item.trim()) : ['']
}

function cleanIdentityValuesText(value: string) {
  return identityValuesFromText(value)
    .map((item) => item.trim())
    .filter(Boolean)
    .join('\n')
}

function objectivesComparisonValue(objectives: StrategicObjective[]) {
  return JSON.stringify(normalizeObjectives(objectives))
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

function ValueListEditor({
  onChange,
  values,
}: {
  onChange: (values: string[]) => void
  values: string[]
}) {
  function updateValue(index: number, value: string) {
    onChange(values.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function addValue() {
    onChange([...values, ''])
  }

  function removeValue(index: number) {
    const nextValues = values.filter((_, itemIndex) => itemIndex !== index)
    onChange(nextValues.length > 0 ? nextValues : [''])
  }

  return (
    <div className="gplan-values-list">
      {values.map((value, index) => (
        <div className="gplan-value-row" key={index}>
          <input
            value={value}
            onChange={(event) => updateValue(index, event.target.value)}
            placeholder={`Valor ${index + 1}`}
          />
          <button
            className="gplan-remove-btn"
            disabled={values.length <= 1}
            title="Quitar valor"
            type="button"
            onClick={() => removeValue(index)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button className="gplan-link-btn" type="button" onClick={addValue}>
        <Plus size={14} />
        Agregar valor
      </button>
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
