import {
  BarChart3,
  Database,
  FileText,
  GitPullRequest,
  History,
  PieChart,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Workflow,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  approvePhaseChangeRequest,
  createPhaseChangeRequest,
  discardPhaseChangeRequest,
  getGroupPlanBcg,
  getGroupPlanSwot,
  getGroupPlanValueChain,
  listPhaseChangeRequests,
  listPhaseVersions,
  rejectPhaseChangeRequest,
  saveGroupPlanBcg,
  saveGroupPlanSwot,
  saveGroupPlanValueChain,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import type {
  BcgPortfolioItemPayload,
  BcgQuadrant,
  BcgSummary,
  CreatePhaseChangeRequestPayload,
  DiagnosticPriority,
  PhaseChangeEntry,
  PhaseChangeRequestSummary,
  PhaseChangeStatus,
  PhaseVersionSummary,
  PlanningGroupSummary,
  PlanSummary,
  SwotItemPayload,
  SwotSummary,
  UpdateBcgPayload,
  UpdateSwotPayload,
  UpdateValueChainPayload,
  ValueChainActivity,
  ValueChainActivityPayload,
  ValueChainAssessmentPayload,
  ValueChainSummary,
} from '../types'
import './DiagnosticsWorkspace.css'

type DiagnosticToolKey = 'foda' | 'valueChain' | 'bcg'
type SwotKey = keyof UpdateSwotPayload

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']

const statusLabels: Record<PhaseChangeStatus, string> = {
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
}

const diagnosticTools: Array<{
  key: DiagnosticToolKey
  icon: typeof ShieldCheck
  title: string
  subtitle: string
}> = [
  { key: 'foda', icon: ShieldCheck, title: 'FODA', subtitle: 'Base estrategica' },
  { key: 'valueChain', icon: Workflow, title: 'Cadena de valor', subtitle: 'Diagnostico interno' },
  { key: 'bcg', icon: PieChart, title: 'BCG', subtitle: 'Cartera de productos' },
]

const supportActivities: ValueChainActivity[] = [
  'INFRAESTRUCTURA_EMPRESARIAL',
  'GESTION_RECURSOS_HUMANOS',
  'COMPRAS',
  'DESARROLLO_TECNOLOGICO',
]

const primaryActivities: ValueChainActivity[] = [
  'LOGISTICA_ENTRADA',
  'OPERACIONES',
  'LOGISTICA_SALIDA',
  'MARKETING_VENTAS',
  'SERVICIOS',
]

const allActivities = [...supportActivities, ...primaryActivities]

const activityLabels: Record<ValueChainActivity, string> = {
  COMPRAS: 'Compras',
  DESARROLLO_TECNOLOGICO: 'Desarrollo tecnologico',
  GESTION_RECURSOS_HUMANOS: 'Gestion de recursos humanos',
  INFRAESTRUCTURA_EMPRESARIAL: 'Infraestructura empresarial',
  LOGISTICA_ENTRADA: 'Logistica de entrada',
  LOGISTICA_SALIDA: 'Logistica de salida',
  MARKETING_VENTAS: 'Marketing y ventas',
  OPERACIONES: 'Operaciones',
  SERVICIOS: 'Servicios',
}

const emptySwot: UpdateSwotPayload = {
  strengths: [{ description: '', priority: 'MEDIA' }],
  opportunities: [{ description: '', priority: 'MEDIA' }],
  weaknesses: [{ description: '', priority: 'MEDIA' }],
  threats: [{ description: '', priority: 'MEDIA' }],
}

const emptyValueChain: UpdateValueChainPayload = {
  supportActivities: [{ activity: 'DESARROLLO_TECNOLOGICO', description: '', priority: 'MEDIA' }],
  primaryActivities: [{ activity: 'OPERACIONES', description: '', priority: 'MEDIA' }],
  assessments: [{ activity: 'DESARROLLO_TECNOLOGICO', statement: '', score: 2, notes: '' }],
  observations: '',
  strengths: [],
  weaknesses: [],
}

const emptyBcg: UpdateBcgPayload = {
  products: [{
    name: '',
    description: '',
    annualSales: 0,
    marketGrowthRate: 0,
    relativeMarketShare: 0,
    notes: '',
  }],
  marketGrowthThreshold: 10,
  relativeMarketShareThreshold: 1,
  observations: '',
  strengths: [],
  weaknesses: [],
}

export function DiagnosticsWorkspace({
  group,
  groupId,
  isLeader,
  onError,
  onNotice,
  onPlanRefresh,
  plan,
}: {
  group: PlanningGroupSummary | null
  groupId: number
  isLeader: boolean
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  onPlanRefresh: () => Promise<void> | void
  plan: PlanSummary
}) {
  const { user } = useAuth()
  const [activeTool, setActiveTool] = useState<DiagnosticToolKey>('foda')
  const [swot, setSwot] = useState<UpdateSwotPayload>(emptySwot)
  const [valueChain, setValueChain] = useState<UpdateValueChainPayload>(emptyValueChain)
  const [bcg, setBcg] = useState<UpdateBcgPayload>(emptyBcg)
  const [swotSummary, setSwotSummary] = useState<SwotSummary | null>(null)
  const [valueChainSummary, setValueChainSummary] = useState<ValueChainSummary | null>(null)
  const [bcgSummary, setBcgSummary] = useState<BcgSummary | null>(null)
  const [changes, setChanges] = useState<PhaseChangeRequestSummary[]>([])
  const [versions, setVersions] = useState<PhaseVersionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)

  const activeToolMeta = diagnosticTools.find((tool) => tool.key === activeTool) ?? diagnosticTools[0]
  const pendingRequest = useMemo(
    () => changes.find((change) => change.status === 'PENDING_APPROVAL') ?? null,
    [changes],
  )
  const activeDraft = useMemo(
    () => changes.find((change) =>
      change.status === 'DRAFT'
      && change.createdByUserId === user?.id
      && contentHasTool(change.proposedContent, activeTool)
    ) ?? null,
    [activeTool, changes, user?.id],
  )
  const phaseStatus: PhaseChangeStatus = pendingRequest
    ? 'PENDING_APPROVAL'
    : activeDraft
      ? 'DRAFT'
      : versions.length > 0 ? 'APPROVED' : 'DRAFT'
  const workflowBusy = workflowAction !== null

  const loadDiagnostics = useCallback(async () => {
    setLoading(true)
    onError(null)
    try {
      const [nextSwot, nextValueChain, nextBcg, nextChanges, nextVersions] = await Promise.all([
        getGroupPlanSwot(groupId),
        getGroupPlanValueChain(groupId),
        getGroupPlanBcg(groupId),
        listPhaseChangeRequests(groupId, 'DIAGNOSTICS'),
        listPhaseVersions(groupId, 'DIAGNOSTICS'),
      ])
      setSwotSummary(nextSwot)
      setValueChainSummary(nextValueChain)
      setBcgSummary(nextBcg)
      setSwot(swotPayloadFromSummary(nextSwot))
      setValueChain(valueChainPayloadFromSummary(nextValueChain))
      setBcg(bcgPayloadFromSummary(nextBcg))
      setChanges(nextChanges)
      setVersions(nextVersions)
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo cargar el bloque de diagnostico.')
    } finally {
      setLoading(false)
    }
  }, [groupId, onError])

  useEffect(() => {
    loadDiagnostics()
  }, [loadDiagnostics])

  async function handleSendForReview() {
    if (pendingRequest) {
      onError('Ya existe una solicitud pendiente para diagnosticos. Espere la revision del lider.')
      return
    }
    const validation = validateActiveTool(activeTool, swot, valueChain, bcg)
    if (validation) {
      onError(validation)
      return
    }

    setWorkflowAction('submit-diagnostics')
    onError(null)
    onNotice(null)
    try {
      if (activeTool === 'foda') {
        const next = await saveGroupPlanSwot(groupId, cleanSwot(swot))
        setSwotSummary(next)
      }
      if (activeTool === 'valueChain') {
        const next = await saveGroupPlanValueChain(groupId, cleanValueChain(valueChain))
        setValueChainSummary(next)
      }
      if (activeTool === 'bcg') {
        const next = await saveGroupPlanBcg(groupId, cleanBcg(bcg))
        setBcgSummary(next)
      }
      const payload = diagnosticChangeRequestPayload(activeTool, swot, valueChain, bcg)
      const request = activeDraft
        ? await updatePhaseChangeRequest(groupId, 'DIAGNOSTICS', activeDraft.id, payload)
        : await createPhaseChangeRequest(groupId, 'DIAGNOSTICS', payload)
      await submitPhaseChangeRequest(groupId, 'DIAGNOSTICS', request.id)
      await loadDiagnostics()
      onNotice(`${activeToolMeta.title} enviado a revision del lider.`)
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo enviar el diagnostico a revision.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleReview(approved: boolean) {
    if (!pendingRequest) return
    setWorkflowAction(approved ? 'approve-diagnostics' : 'reject-diagnostics')
    onError(null)
    onNotice(null)
    try {
      if (approved) {
        await approvePhaseChangeRequest(groupId, 'DIAGNOSTICS', pendingRequest.id, { comment: '' })
      } else {
        await rejectPhaseChangeRequest(groupId, 'DIAGNOSTICS', pendingRequest.id, { comment: '' })
      }
      await loadDiagnostics()
      await onPlanRefresh()
      onNotice(approved ? 'Solicitud de diagnostico aprobada.' : 'Solicitud de diagnostico rechazada.')
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo revisar el diagnostico.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleDiscardDraft() {
    if (!activeDraft) return
    setWorkflowAction('discard-diagnostics')
    onError(null)
    onNotice(null)
    try {
      await discardPhaseChangeRequest(groupId, 'DIAGNOSTICS', activeDraft.id)
      setChanges((current) => current.filter((change) => change.id !== activeDraft.id))
      onNotice(`Borrador de ${activeToolMeta.title} descartado.`)
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo descartar el borrador.')
    } finally {
      setWorkflowAction(null)
    }
  }

  return (
    <div className="content-grid diag-grid">
      <div className="form-area">
        <section className="card gplan-plan-summary-card">
          <div className="card-header">
            <FileText size={18} />
            <h2>Plan del grupo</h2>
          </div>
          <div className="gplan-plan-summary-grid">
            <PlanMetric label="Grupo" value={group?.name ?? '-'} />
            <PlanMetric label="Plan" value={plan.id ? `#${plan.id}` : '-'} />
            <PlanMetric label="Fase activa" value={activePhaseTitle(plan)} />
          </div>
        </section>

        <section className="card diag-workspace">
          <div className="card-header gplan-card-header-action">
            <div className="gplan-card-title">
              <Database size={18} />
              <h2>Bloque diagnostico</h2>
            </div>
            <span className="diag-updated">Actualizado {formatDate(activeUpdatedAt(activeTool, swotSummary, valueChainSummary, bcgSummary))}</span>
          </div>
          <div className="diag-tabs" role="tablist" aria-label="Herramientas de diagnostico">
            {diagnosticTools.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  className={`diag-tab ${activeTool === tool.key ? 'active' : ''}`}
                  key={tool.key}
                  type="button"
                  onClick={() => setActiveTool(tool.key)}
                >
                  <Icon size={17} />
                  <span>
                    <strong>{tool.title}</strong>
                    <small>{tool.subtitle}</small>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="card-body diag-body">
            {loading && <p className="gplan-muted">Cargando diagnosticos...</p>}
            {!loading && activeTool === 'foda' && (
              <SwotEditor swot={swot} onChange={setSwot} />
            )}
            {!loading && activeTool === 'valueChain' && (
              <ValueChainEditor value={valueChain} onChange={setValueChain} />
            )}
            {!loading && activeTool === 'bcg' && (
              <BcgEditor summary={bcgSummary} value={bcg} onChange={setBcg} />
            )}
          </div>
        </section>

        <div className="form-actions">
          {activeDraft && (
            <button
              className="btn btn-secondary"
              type="button"
              disabled={workflowBusy}
              onClick={handleDiscardDraft}
            >
              <Trash2 size={16} />
              Descartar cambio
            </button>
          )}
          <button
            className="btn btn-primary"
            type="button"
            disabled={loading || workflowBusy || Boolean(pendingRequest)}
            onClick={handleSendForReview}
          >
            <Send size={16} />
            {workflowAction === 'submit-diagnostics' ? 'Enviando...' : 'Enviar a revision'}
          </button>
        </div>
      </div>

      <aside className="tools-panel">
        <div className="card-header">
          <BarChart3 size={18} />
          <h2>Diagnostico</h2>
        </div>
        <div className="gplan-side-body">
          <div className="diag-score-grid">
            <DiagnosticMetric label="FODA" value={String(swotCount(swotSummary))} />
            <DiagnosticMetric label="Cadena" value={`${valueChainSummary?.scorePercentage ?? 0}%`} />
            <DiagnosticMetric label="BCG" value={String(bcgSummary?.products.length ?? 0)} />
          </div>

          <div className="gplan-workflow-summary">
            <div className="gplan-workflow-title">
              <GitPullRequest size={16} />
              <span>Revision diagnostico</span>
            </div>
            <span className={`gplan-status gplan-status--${phaseStatus.toLowerCase()}`}>
              {statusLabels[phaseStatus]}
            </span>
            {pendingRequest && (
              <div className="gplan-request-card">
                <strong>{pendingRequest.title}</strong>
                <span>Enviada {formatDate(pendingRequest.submittedAt ?? pendingRequest.updatedAt)}</span>
                {isLeader && (
                  <div className="gplan-review-actions">
                    <button
                      className="gplan-review-btn approve"
                      type="button"
                      disabled={workflowBusy}
                      onClick={() => handleReview(true)}
                    >
                      <ShieldCheck size={14} />
                      Aprobar
                    </button>
                    <button
                      className="gplan-review-btn reject"
                      type="button"
                      disabled={workflowBusy}
                      onClick={() => handleReview(false)}
                    >
                      <XCircle size={14} />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            )}
            {!pendingRequest && activeDraft && (
              <div className="gplan-request-card">
                <strong>{activeDraft.title}</strong>
                <span>Borrador actualizado {formatDate(activeDraft.updatedAt)}</span>
              </div>
            )}
            {!pendingRequest && !activeDraft && (
              <p className="gplan-muted">Complete la herramienta activa y enviela a revision.</p>
            )}
          </div>

          <div className="gplan-history-block">
            <div className="gplan-workflow-title">
              <History size={16} />
              <span>Versiones</span>
            </div>
            {versions.length === 0 && <p className="gplan-muted">Sin versiones aprobadas en diagnosticos.</p>}
            {versions.slice(0, 4).map((version) => (
              <div className="diag-version-row" key={version.id}>
                <span>v{version.versionNumber}</span>
                <strong>{formatDate(version.approvedAt)}</strong>
              </div>
            ))}
          </div>

        </div>
      </aside>
    </div>
  )
}

function SwotEditor({
  onChange,
  swot,
}: {
  onChange: (value: UpdateSwotPayload) => void
  swot: UpdateSwotPayload
}) {
  const sections: Array<{ key: SwotKey; title: string }> = [
    { key: 'strengths', title: 'Fortalezas' },
    { key: 'opportunities', title: 'Oportunidades' },
    { key: 'weaknesses', title: 'Debilidades' },
    { key: 'threats', title: 'Amenazas' },
  ]

  function updateItem(key: SwotKey, index: number, patch: Partial<SwotItemPayload>) {
    onChange({
      ...swot,
      [key]: swot[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  function addItem(key: SwotKey) {
    onChange({ ...swot, [key]: [...swot[key], { description: '', priority: 'MEDIA' }] })
  }

  function removeItem(key: SwotKey, index: number) {
    const next = swot[key].filter((_, i) => i !== index)
    onChange({ ...swot, [key]: next.length > 0 ? next : [{ description: '', priority: 'MEDIA' }] })
  }

  return (
    <div className="diag-swot-layout">
      <SwotChart swot={swot} />
      <div className="diag-swot-grid">
        {sections.map((section) => (
          <section className="diag-panel" key={section.key}>
            <div className="diag-panel-head">
              <h3>{section.title}</h3>
              <button className="gplan-inline-btn" type="button" onClick={() => addItem(section.key)}>
                <Plus size={14} />
                Agregar
              </button>
            </div>
            <div className="diag-list">
              {swot[section.key].map((item, index) => (
                <div className="diag-row" key={index}>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(event) => updateItem(section.key, index, { description: event.target.value })}
                    placeholder={`${section.title.slice(0, )} ${index + 1}`}
                  />
                  <div className="diag-row-actions">
                    <PrioritySelect
                      value={item.priority}
                      onChange={(priority) => updateItem(section.key, index, { priority })}
                    />
                    <button className="gplan-remove-btn" type="button" onClick={() => removeItem(section.key, index)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function ValueChainEditor({
  onChange,
  value,
}: {
  onChange: (value: UpdateValueChainPayload) => void
  value: UpdateValueChainPayload
}) {
  function updateActivity(
    listKey: 'supportActivities' | 'primaryActivities',
    index: number,
    patch: Partial<ValueChainActivityPayload>,
  ) {
    onChange({
      ...value,
      [listKey]: value[listKey].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  function addActivity(listKey: 'supportActivities' | 'primaryActivities') {
    const activity = listKey === 'supportActivities' ? 'DESARROLLO_TECNOLOGICO' : 'OPERACIONES'
    onChange({
      ...value,
      [listKey]: [...value[listKey], { activity, description: '', priority: 'MEDIA' }],
    })
  }

  function removeActivity(listKey: 'supportActivities' | 'primaryActivities', index: number) {
    const activity = listKey === 'supportActivities' ? 'DESARROLLO_TECNOLOGICO' : 'OPERACIONES'
    const next = value[listKey].filter((_, i) => i !== index)
    onChange({
      ...value,
      [listKey]: next.length > 0 ? next : [{ activity, description: '', priority: 'MEDIA' }],
    })
  }

  function updateAssessment(index: number, patch: Partial<ValueChainAssessmentPayload>) {
    onChange({
      ...value,
      assessments: value.assessments.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  function addAssessment() {
    onChange({
      ...value,
      assessments: [...value.assessments, { activity: 'DESARROLLO_TECNOLOGICO', statement: '', score: 2, notes: '' }],
    })
  }

  function removeAssessment(index: number) {
    const next = value.assessments.filter((_, i) => i !== index)
    onChange({
      ...value,
      assessments: next.length > 0 ? next : [{ activity: 'DESARROLLO_TECNOLOGICO', statement: '', score: 2, notes: '' }],
    })
  }

  return (
    <div className="diag-chain-layout">
      <ValueChainChart value={value} />
      <ActivityPanel
        activities={value.supportActivities}
        options={supportActivities}
        title="Actividades de apoyo"
        onAdd={() => addActivity('supportActivities')}
        onRemove={(index) => removeActivity('supportActivities', index)}
        onUpdate={(index, patch) => updateActivity('supportActivities', index, patch)}
      />
      <ActivityPanel
        activities={value.primaryActivities}
        options={primaryActivities}
        title="Actividades primarias"
        onAdd={() => addActivity('primaryActivities')}
        onRemove={(index) => removeActivity('primaryActivities', index)}
        onUpdate={(index, patch) => updateActivity('primaryActivities', index, patch)}
      />
      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <h3>Autodiagnostico</h3>
          <button className="gplan-inline-btn" type="button" onClick={addAssessment}>
            <Plus size={14} />
            Agregar
          </button>
        </div>
        <div className="diag-list">
          {value.assessments.map((assessment, index) => (
            <div className="diag-assessment" key={index}>
              <select
                value={assessment.activity}
                onChange={(event) => updateAssessment(index, { activity: event.target.value as ValueChainActivity })}
              >
                {allActivities.map((activity) => (
                  <option key={activity} value={activity}>{activityLabels[activity]}</option>
                ))}
              </select>
              <input
                value={assessment.statement}
                onChange={(event) => updateAssessment(index, { statement: event.target.value })}
                placeholder="Criterio o afirmacion"
              />
              <input
                min={0}
                max={4}
                type="number"
                value={assessment.score}
                onChange={(event) => updateAssessment(index, { score: numberValue(event.target.value) })}
                aria-label="Puntaje"
              />
              <input
                value={assessment.notes}
                onChange={(event) => updateAssessment(index, { notes: event.target.value })}
                placeholder="Notas"
              />
              <button className="gplan-remove-btn" type="button" onClick={() => removeAssessment(index)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
      <TextBlocks
        observations={value.observations}
        strengths={value.strengths}
        weaknesses={value.weaknesses}
        onChange={(patch) => onChange({ ...value, ...patch })}
      />
    </div>
  )
}

function ActivityPanel({
  activities,
  onAdd,
  onRemove,
  onUpdate,
  options,
  title,
}: {
  activities: ValueChainActivityPayload[]
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<ValueChainActivityPayload>) => void
  options: ValueChainActivity[]
  title: string
}) {
  return (
    <section className="diag-panel">
      <div className="diag-panel-head">
        <h3>{title}</h3>
        <button className="gplan-inline-btn" type="button" onClick={onAdd}>
          <Plus size={14} />
          Agregar
        </button>
      </div>
      <div className="diag-list">
        {activities.map((item, index) => (
          <div className="diag-activity" key={index}>
            <select
              value={item.activity}
              onChange={(event) => onUpdate(index, { activity: event.target.value as ValueChainActivity })}
            >
              {options.map((activity) => (
                <option key={activity} value={activity}>{activityLabels[activity]}</option>
              ))}
            </select>
            <textarea
              rows={2}
              value={item.description}
              onChange={(event) => onUpdate(index, { description: event.target.value })}
              placeholder="Descripcion de aporte a la cadena"
            />
            <div className="diag-row-actions">
              <PrioritySelect value={item.priority} onChange={(priority) => onUpdate(index, { priority })} />
              <button className="gplan-remove-btn" type="button" onClick={() => onRemove(index)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function BcgEditor({
  onChange,
  summary,
  value,
}: {
  onChange: (value: UpdateBcgPayload) => void
  summary: BcgSummary | null
  value: UpdateBcgPayload
}) {
  function updateProduct(index: number, patch: Partial<BcgPortfolioItemPayload>) {
    onChange({
      ...value,
      products: value.products.map((product, i) => (i === index ? { ...product, ...patch } : product)),
    })
  }

  function addProduct() {
    onChange({ ...value, products: [...value.products, emptyBcg.products[0]] })
  }

  function removeProduct(index: number) {
    const next = value.products.filter((_, i) => i !== index)
    onChange({ ...value, products: next.length > 0 ? next : emptyBcg.products })
  }

  return (
    <div className="diag-bcg-layout">
      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <h3>Cartera de productos o servicios</h3>
          <button className="gplan-inline-btn" type="button" onClick={addProduct}>
            <Plus size={14} />
            Agregar
          </button>
        </div>
        <div className="diag-bcg-thresholds">
          <label>
            <span>Crecimiento alto desde</span>
            <input
              type="number"
              value={value.marketGrowthThreshold}
              onChange={(event) => onChange({ ...value, marketGrowthThreshold: numberValue(event.target.value) })}
            />
          </label>
          <label>
            <span>Participacion alta desde</span>
            <input
              min={0.01}
              step="0.01"
              type="number"
              value={value.relativeMarketShareThreshold}
              onChange={(event) => onChange({ ...value, relativeMarketShareThreshold: numberValue(event.target.value) })}
            />
          </label>
        </div>
        <div className="diag-bcg-products">
          {value.products.map((product, index) => (
            <article className="diag-bcg-product" key={index}>
              <div className="diag-bcg-product-head">
                <strong>Producto {index + 1}</strong>
                <button className="gplan-remove-btn" type="button" onClick={() => removeProduct(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="diag-bcg-fields">
                <input
                  value={product.name}
                  onChange={(event) => updateProduct(index, { name: event.target.value })}
                  placeholder="Nombre del producto o servicio"
                />
                <input
                  min={0}
                  type="number"
                  value={product.annualSales}
                  onChange={(event) => updateProduct(index, { annualSales: numberValue(event.target.value) })}
                  placeholder="Ventas"
                />
                <input
                  type="number"
                  value={product.marketGrowthRate}
                  onChange={(event) => updateProduct(index, { marketGrowthRate: numberValue(event.target.value) })}
                  placeholder="TCM"
                />
                <input
                  min={0}
                  step="0.01"
                  type="number"
                  value={product.relativeMarketShare}
                  onChange={(event) => updateProduct(index, { relativeMarketShare: numberValue(event.target.value) })}
                  placeholder="PRM"
                />
                <textarea
                  rows={2}
                  value={product.description}
                  onChange={(event) => updateProduct(index, { description: event.target.value })}
                  placeholder="Descripcion"
                />
                <textarea
                  rows={2}
                  value={product.notes}
                  onChange={(event) => updateProduct(index, { notes: event.target.value })}
                  placeholder="Notas estrategicas"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {summary && (
        <section className="diag-panel wide">
          <div className="diag-panel-head">
            <h3>Resultado BCG</h3>
            <span className="diag-total">Ventas {formatNumber(summary.totalSales)}</span>
          </div>
          <BcgMatrix value={value} />
          <div className="diag-bcg-result">
            <DiagnosticMetric label="Estrellas" value={String(summary.stars)} />
            <DiagnosticMetric label="Incognitas" value={String(summary.questionMarks)} />
            <DiagnosticMetric label="Vacas" value={String(summary.cashCows)} />
            <DiagnosticMetric label="Perros" value={String(summary.dogs)} />
          </div>
          <div className="diag-version-list">
            {summary.products.map((product) => (
              <div className="diag-version-row" key={`${product.name}-${product.position}`}>
                <span>{product.name}</span>
                <strong>{product.quadrant}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <TextBlocks
        observations={value.observations}
        strengths={value.strengths}
        weaknesses={value.weaknesses}
        onChange={(patch) => onChange({ ...value, ...patch })}
      />
    </div>
  )
}

function SwotChart({ swot }: { swot: UpdateSwotPayload }) {
  const sections: Array<{ color: string; key: SwotKey; label: string }> = [
    { key: 'strengths', label: 'Fortalezas', color: '#22c55e' },
    { key: 'opportunities', label: 'Oportunidades', color: '#3b82f6' },
    { key: 'weaknesses', label: 'Debilidades', color: '#f59e0b' },
    { key: 'threats', label: 'Amenazas', color: '#ef4444' },
  ]
  const counts = sections.map((section) => ({
    ...section,
    value: cleanSwotItems(swot[section.key]).length,
  }))
  const maxCount = Math.max(1, ...counts.map((item) => item.value))
  const allItems = sections.flatMap((section) => cleanSwotItems(swot[section.key]))
  const priorityCounts = priorities.map((priority) => ({
    priority,
    value: allItems.filter((item) => item.priority === priority).length,
  }))

  return (
    <section className="diag-chart-card wide">
      <div className="diag-chart-head">
        <div>
          <span>Grafico FODA</span>
          <h3>Distribucion por cuadrante</h3>
        </div>
        <strong>{allItems.length} items</strong>
      </div>
      <div className="diag-bar-chart">
        {counts.map((item) => (
          <div className="diag-bar-row" key={item.key}>
            <span>{item.label}</span>
            <div className="diag-bar-track">
              <div
                className="diag-bar-fill"
                style={{ backgroundColor: item.color, width: `${(item.value / maxCount) * 100}%` }}
              />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      <div className="diag-priority-strip">
        {priorityCounts.map((item) => (
          <span className={`diag-priority-pill ${item.priority.toLowerCase()}`} key={item.priority}>
            {item.priority} · {item.value}
          </span>
        ))}
      </div>
    </section>
  )
}

function ValueChainChart({ value }: { value: UpdateValueChainPayload }) {
  const assessments = value.assessments.filter((assessment) => assessment.statement.trim())
  const totalScore = assessments.reduce((total, assessment) => total + clamp(assessment.score, 0, 4), 0)
  const maxScore = assessments.length * 4
  const percentage = maxScore === 0 ? 0 : Math.round((totalScore * 100) / maxScore)
  const activityScores = allActivities
    .map((activity) => {
      const items = assessments.filter((assessment) => assessment.activity === activity)
      const total = items.reduce((sum, item) => sum + clamp(item.score, 0, 4), 0)
      return {
        activity,
        count: items.length,
        percentage: items.length === 0 ? 0 : Math.round((total * 100) / (items.length * 4)),
      }
    })
    .filter((item) => item.count > 0)

  return (
    <section className="diag-chart-card wide">
      <div className="diag-chart-head">
        <div>
          <span>Grafico cadena de valor</span>
          <h3>Puntaje por actividad</h3>
        </div>
        <strong>{percentage}%</strong>
      </div>
      <div className="diag-score-visual">
        <div className="diag-score-ring" style={{ background: `conic-gradient(var(--blue) ${percentage}%, var(--surface-3) 0)` }}>
          <div>
            <strong>{totalScore}</strong>
            <span>/{maxScore || 0}</span>
          </div>
        </div>
        <div className="diag-score-bars">
          {activityScores.length === 0 && <p className="gplan-muted">Registre valoraciones para visualizar el puntaje.</p>}
          {activityScores.map((item) => (
            <div className="diag-score-bar-row" key={item.activity}>
              <span>{activityLabels[item.activity]}</span>
              <div className="diag-bar-track">
                <div className="diag-bar-fill" style={{ width: `${item.percentage}%` }} />
              </div>
              <strong>{item.percentage}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BcgMatrix({ value }: { value: UpdateBcgPayload }) {
  const products = value.products
    .filter((product) => product.name.trim())
    .map((product, index) => ({ ...product, name: product.name.trim() || `Producto ${index + 1}` }))
  const growthThreshold = value.marketGrowthThreshold || 10
  const shareThreshold = value.relativeMarketShareThreshold > 0 ? value.relativeMarketShareThreshold : 1
  const maxSales = Math.max(1, ...products.map((product) => product.annualSales))
  const bubbles = products.map((product) => {
    const quadrant = classifyBcg(product.marketGrowthRate, product.relativeMarketShare, growthThreshold, shareThreshold)
    return {
      ...product,
      quadrant,
      size: 18 + (Math.max(0, product.annualSales) / maxSales) * 26,
      x: matrixCoordinate(product.relativeMarketShare, shareThreshold),
      y: 100 - matrixCoordinate(product.marketGrowthRate, growthThreshold),
    }
  })

  return (
    <div className="diag-bcg-matrix-wrap">
      <div className="diag-bcg-axis x">Participacion relativa</div>
      <div className="diag-bcg-axis y">Crecimiento del mercado</div>
      <div className="diag-bcg-matrix">
        <div className="diag-bcg-quadrant star">Estrella</div>
        <div className="diag-bcg-quadrant question">Incognita</div>
        <div className="diag-bcg-quadrant cow">Vaca</div>
        <div className="diag-bcg-quadrant dog">Perro</div>
        {bubbles.map((product, index) => (
          <span
            className={`diag-bcg-bubble ${product.quadrant.toLowerCase()}`}
            key={`${product.name}-${index}`}
            style={{
              height: product.size,
              left: `${product.x}%`,
              top: `${product.y}%`,
              width: product.size,
            }}
            title={`${product.name}: ${product.quadrant}`}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="diag-bcg-legend">
        {bubbles.length === 0 && <span>Agregue productos para graficar la matriz.</span>}
        {bubbles.map((product, index) => (
          <span key={`${product.name}-legend-${index}`}>
            {index + 1}. {product.name} · {product.quadrant}
          </span>
        ))}
      </div>
    </div>
  )
}

function TextBlocks({
  observations,
  onChange,
  strengths,
  weaknesses,
}: {
  observations: string
  onChange: (patch: Pick<UpdateValueChainPayload, 'observations' | 'strengths' | 'weaknesses'>) => void
  strengths: string[]
  weaknesses: string[]
}) {
  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <h3>Sintesis</h3>
      </div>
      <div className="diag-text-grid">
        <label className="field">
          <span className="field-label">Observaciones</span>
          <textarea
            rows={3}
            value={observations}
            onChange={(event) => onChange({ observations: event.target.value, strengths, weaknesses })}
            placeholder="Lectura general del diagnostico"
          />
        </label>
        <label className="field">
          <span className="field-label">Fortalezas</span>
          <textarea
            rows={3}
            value={strengths.join('\n')}
            onChange={(event) => onChange({ observations, strengths: splitLines(event.target.value), weaknesses })}
            placeholder="Una fortaleza por linea"
          />
        </label>
        <label className="field">
          <span className="field-label">Debilidades</span>
          <textarea
            rows={3}
            value={weaknesses.join('\n')}
            onChange={(event) => onChange({ observations, strengths, weaknesses: splitLines(event.target.value) })}
            placeholder="Una debilidad por linea"
          />
        </label>
      </div>
    </section>
  )
}

function DiagnosticMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="diag-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gplan-dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function PrioritySelect({
  onChange,
  value,
}: {
  onChange: (priority: DiagnosticPriority) => void
  value: DiagnosticPriority
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as DiagnosticPriority)}>
      {priorities.map((priority) => (
        <option key={priority} value={priority}>{priority}</option>
      ))}
    </select>
  )
}

function swotPayloadFromSummary(summary: SwotSummary): UpdateSwotPayload {
  return {
    strengths: swotItems(summary.strengths),
    opportunities: swotItems(summary.opportunities),
    weaknesses: swotItems(summary.weaknesses),
    threats: swotItems(summary.threats),
  }
}

function swotItems(items: Array<{ description: string; priority: DiagnosticPriority }>) {
  const next = items.map((item) => ({ description: item.description, priority: item.priority }))
  return next.length > 0 ? next : [{ description: '', priority: 'MEDIA' as DiagnosticPriority }]
}

function valueChainPayloadFromSummary(summary: ValueChainSummary): UpdateValueChainPayload {
  return {
    supportActivities: activityItems(summary.supportActivities, 'DESARROLLO_TECNOLOGICO'),
    primaryActivities: activityItems(summary.primaryActivities, 'OPERACIONES'),
    assessments: summary.assessments.length > 0
      ? summary.assessments.map((item) => ({
          activity: item.activity,
          statement: item.statement,
          score: item.score,
          notes: item.notes,
        }))
      : emptyValueChain.assessments,
    observations: summary.observations,
    strengths: summary.strengths,
    weaknesses: summary.weaknesses,
  }
}

function activityItems(
  items: Array<{ activity: ValueChainActivity; description: string; priority: DiagnosticPriority }>,
  fallback: ValueChainActivity,
) {
  const next = items.map((item) => ({
    activity: item.activity,
    description: item.description,
    priority: item.priority,
  }))
  return next.length > 0 ? next : [{ activity: fallback, description: '', priority: 'MEDIA' as DiagnosticPriority }]
}

function bcgPayloadFromSummary(summary: BcgSummary): UpdateBcgPayload {
  return {
    products: summary.products.length > 0
      ? summary.products.map((product) => ({
          name: product.name,
          description: product.description,
          annualSales: product.annualSales,
          marketGrowthRate: product.marketGrowthRate,
          relativeMarketShare: product.relativeMarketShare,
          notes: product.notes,
        }))
      : emptyBcg.products,
    marketGrowthThreshold: summary.marketGrowthThreshold || 10,
    relativeMarketShareThreshold: summary.relativeMarketShareThreshold || 1,
    observations: summary.observations,
    strengths: summary.strengths,
    weaknesses: summary.weaknesses,
  }
}

function cleanSwot(value: UpdateSwotPayload): UpdateSwotPayload {
  return {
    strengths: cleanSwotItems(value.strengths),
    opportunities: cleanSwotItems(value.opportunities),
    weaknesses: cleanSwotItems(value.weaknesses),
    threats: cleanSwotItems(value.threats),
  }
}

function cleanSwotItems(items: SwotItemPayload[]) {
  return items
    .map((item) => ({ description: item.description.trim(), priority: item.priority }))
    .filter((item) => item.description)
}

function cleanValueChain(value: UpdateValueChainPayload): UpdateValueChainPayload {
  return {
    supportActivities: cleanActivities(value.supportActivities),
    primaryActivities: cleanActivities(value.primaryActivities),
    assessments: value.assessments
      .map((item) => ({
        activity: item.activity,
        statement: item.statement.trim(),
        score: clamp(item.score, 0, 4),
        notes: item.notes.trim(),
      }))
      .filter((item) => item.statement),
    observations: value.observations.trim(),
    strengths: cleanLines(value.strengths),
    weaknesses: cleanLines(value.weaknesses),
  }
}

function cleanActivities(items: ValueChainActivityPayload[]) {
  return items
    .map((item) => ({
      activity: item.activity,
      description: item.description.trim(),
      priority: item.priority,
    }))
    .filter((item) => item.description)
}

function cleanBcg(value: UpdateBcgPayload): UpdateBcgPayload {
  return {
    products: value.products
      .map((product) => ({
        name: product.name.trim(),
        description: product.description.trim(),
        annualSales: Math.max(0, product.annualSales),
        marketGrowthRate: product.marketGrowthRate,
        relativeMarketShare: Math.max(0, product.relativeMarketShare),
        notes: product.notes.trim(),
      }))
      .filter((product) => product.name),
    marketGrowthThreshold: value.marketGrowthThreshold,
    relativeMarketShareThreshold: value.relativeMarketShareThreshold,
    observations: value.observations.trim(),
    strengths: cleanLines(value.strengths),
    weaknesses: cleanLines(value.weaknesses),
  }
}

function validateActiveTool(
  activeTool: DiagnosticToolKey,
  swot: UpdateSwotPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
) {
  if (activeTool === 'foda') {
    const payload = cleanSwot(swot)
    if (!payload.strengths.length || !payload.opportunities.length || !payload.weaknesses.length || !payload.threats.length) {
      return 'Complete al menos un item en fortalezas, oportunidades, debilidades y amenazas.'
    }
  }
  if (activeTool === 'valueChain') {
    const payload = cleanValueChain(valueChain)
    if (!payload.supportActivities.length || !payload.primaryActivities.length || !payload.assessments.length) {
      return 'Complete al menos una actividad de apoyo, una primaria y una valoracion.'
    }
  }
  if (activeTool === 'bcg') {
    const payload = cleanBcg(bcg)
    if (!payload.products.length) {
      return 'Complete al menos un producto o servicio para BCG.'
    }
    if (payload.relativeMarketShareThreshold <= 0) {
      return 'La participacion relativa alta debe ser mayor a cero.'
    }
  }
  return ''
}

function diagnosticChangeRequestPayload(
  activeTool: DiagnosticToolKey,
  swot: UpdateSwotPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
): CreatePhaseChangeRequestPayload {
  const title = activeTool === 'foda'
    ? 'Aprobar FODA'
    : activeTool === 'valueChain'
      ? 'Aprobar cadena de valor'
      : 'Aprobar BCG'
  const content = activeTool === 'foda'
    ? { swot: cleanSwot(swot) }
    : activeTool === 'valueChain'
      ? { valueChain: cleanValueChain(valueChain) }
      : { bcg: cleanBcg(bcg) }
  return {
    title,
    description: 'Solicitud para aprobar una herramienta del bloque diagnostico.',
    proposedContent: content,
    entries: diagnosticEntries(activeTool),
  }
}

function diagnosticEntries(activeTool: DiagnosticToolKey): PhaseChangeEntry[] {
  const label = activeTool === 'foda' ? 'FODA' : activeTool === 'valueChain' ? 'Cadena de valor' : 'BCG'
  return [{ fieldKey: activeTool, previousValue: '', proposedValue: `${label} validado` }]
}

function contentHasTool(content: Record<string, unknown>, tool: DiagnosticToolKey) {
  if (tool === 'foda') return Boolean(content.swot)
  if (tool === 'valueChain') return Boolean(content.valueChain)
  return Boolean(content.bcg)
}

function swotCount(summary: SwotSummary | null) {
  if (!summary) return 0
  return summary.strengths.length + summary.opportunities.length + summary.weaknesses.length + summary.threats.length
}

function activeUpdatedAt(
  activeTool: DiagnosticToolKey,
  swot: SwotSummary | null,
  valueChain: ValueChainSummary | null,
  bcg: BcgSummary | null,
) {
  if (activeTool === 'foda') return swot?.updatedAt
  if (activeTool === 'valueChain') return valueChain?.updatedAt
  return bcg?.updatedAt
}

function activePhaseTitle(plan: PlanSummary) {
  return plan.phases.find((phase) => phase.phase === plan.activePhase)?.title ?? '-'
}

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean)
}

function cleanLines(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean)
}

function numberValue(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function classifyBcg(
  marketGrowthRate: number,
  relativeMarketShare: number,
  marketGrowthThreshold: number,
  relativeMarketShareThreshold: number,
): BcgQuadrant {
  const highGrowth = marketGrowthRate >= marketGrowthThreshold
  const highShare = relativeMarketShare >= relativeMarketShareThreshold
  if (highGrowth && highShare) return 'ESTRELLA'
  if (highGrowth) return 'INCOGNITA'
  if (highShare) return 'VACA'
  return 'PERRO'
}

function matrixCoordinate(value: number, threshold: number) {
  const safeThreshold = threshold > 0 ? threshold : 1
  if (value >= safeThreshold) {
    return clamp(55 + ((value - safeThreshold) / safeThreshold) * 40, 55, 94)
  }
  return clamp(6 + (value / safeThreshold) * 39, 6, 45)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}
