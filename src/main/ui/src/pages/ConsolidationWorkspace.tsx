import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  GitPullRequest,
  Layers3,
  Send,
  Target,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  createPhaseChangeRequest,
  getGroupPlanBcg,
  getGroupPlanIdentity,
  getGroupPlanSwot,
  listPhaseChangeRequests,
  listPhaseVersions,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import type {
  BcgSummary,
  CamePayload,
  CreatePhaseChangeRequestPayload,
  IdentitySectionSummary,
  PhaseChangeEntry,
  PhaseChangeRequestSummary,
  PhaseVersionSummary,
  PlanningGroupSummary,
  PlanSummary,
  StrategyIdentificationPayload,
  StrategyRelation,
  SwotSummary,
} from '../types'
import './DiagnosticsWorkspace.css'
import './FormulationWorkspace.css'
import './ConsolidationWorkspace.css'

type ConsolidationPayload = {
  conclusions: string
}

type FormulationSnapshot = {
  came: CamePayload | null
  identification: StrategyIdentificationPayload | null
}

const emptyConsolidation: ConsolidationPayload = { conclusions: '' }
const relationLabels: Record<StrategyRelation, string> = {
  FO: 'Estrategia ofensiva',
  AF: 'Estrategia defensiva',
  AD: 'Estrategia de supervivencia',
  OD: 'Estrategia de reorientacion',
}

export function ConsolidationWorkspace({
  group,
  groupId,
  onError,
  onNotice,
  plan,
}: {
  group: PlanningGroupSummary | null
  groupId: number
  onError: (message: string | null) => void
  onNotice: (message: string | null) => void
  plan: PlanSummary
}) {
  const { user } = useAuth()
  const [identity, setIdentity] = useState<IdentitySectionSummary | null>(null)
  const [bcg, setBcg] = useState<BcgSummary | null>(null)
  const [swot, setSwot] = useState<SwotSummary | null>(null)
  const [formulationVersions, setFormulationVersions] = useState<PhaseVersionSummary[]>([])
  const [changes, setChanges] = useState<PhaseChangeRequestSummary[]>([])
  const [versions, setVersions] = useState<PhaseVersionSummary[]>([])
  const [payload, setPayload] = useState<ConsolidationPayload>(emptyConsolidation)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const pendingRequest = useMemo(
    () => changes.find((change) => change.status === 'PENDING_APPROVAL') ?? null,
    [changes],
  )
  const activeDraft = useMemo(
    () => changes.find((change) => change.status === 'DRAFT' && change.createdByUserId === user?.id) ?? null,
    [changes, user?.id],
  )
  const latestVersion = versions[0] ?? null
  const formulation = useMemo(() => formulationSnapshot(formulationVersions), [formulationVersions])
  const completed = plan.phases.find((phase) => phase.phase === 'CONSOLIDATION')?.completed ?? false

  const load = useCallback(async () => {
    setLoading(true)
    onError(null)
    try {
      const [
        nextIdentity,
        nextBcg,
        nextSwot,
        nextFormulationVersions,
        nextChanges,
        nextVersions,
      ] = await Promise.all([
        getGroupPlanIdentity(groupId),
        getGroupPlanBcg(groupId),
        getGroupPlanSwot(groupId),
        listPhaseVersions(groupId, 'FORMULATION'),
        listPhaseChangeRequests(groupId, 'CONSOLIDATION'),
        listPhaseVersions(groupId, 'CONSOLIDATION'),
      ])
      const draft = nextChanges.find((change) => change.status === 'DRAFT' && change.createdByUserId === user?.id)
      setIdentity(nextIdentity)
      setBcg(nextBcg)
      setSwot(nextSwot)
      setFormulationVersions(nextFormulationVersions)
      setChanges(nextChanges)
      setVersions(nextVersions)
      setPayload(consolidationFromContent(draft?.proposedContent ?? nextVersions[0]?.content ?? {}))
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo cargar la consolidacion.')
    } finally {
      setLoading(false)
    }
  }, [groupId, onError, user?.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleSendForReview() {
    if (pendingRequest) {
      onError('Ya existe una solicitud pendiente para consolidacion.')
      return
    }
    const next = cleanConsolidation(payload)
    if (!next.conclusions) {
      onError('Registre las conclusiones para cerrar la consolidacion.')
      return
    }
    const current = consolidationFromContent(latestVersion?.content ?? {})
    const entries = consolidationEntries(current, next)
    if (entries.length === 0) {
      onError('No hay cambios para enviar a revision.')
      return
    }
    setSubmitting(true)
    onError(null)
    onNotice(null)
    try {
      const requestPayload = consolidationChangeRequestPayload(next, entries)
      const request = activeDraft
        ? await updatePhaseChangeRequest(groupId, 'CONSOLIDATION', activeDraft.id, requestPayload)
        : await createPhaseChangeRequest(groupId, 'CONSOLIDATION', requestPayload)
      await submitPhaseChangeRequest(groupId, 'CONSOLIDATION', request.id)
      await load()
      onNotice('Consolidacion enviada a revision del lider.')
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo enviar la consolidacion a revision.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="content-grid formu-grid">
      <div className="form-area">
        <section className="card gplan-plan-summary-card">
          <div className="card-header">
            <FileText size={18} />
            <h2>Plan del grupo</h2>
          </div>
          <div className="gplan-plan-summary-grid">
            <Metric label="Grupo" value={group?.name ?? '-'} />
            <Metric label="Fase" value={completed ? 'Cerrada' : 'En consolidacion'} />
          </div>
        </section>

        <section className="card diag-workspace">
          <div className="card-header">
            <FileText size={18} />
            <h2>Resumen ejecutivo</h2>
          </div>
          <div className="diag-body formu-body">
            {loading && <p className="gplan-muted">Cargando consolidacion...</p>}
            {!loading && (
              <>
                <ExecutiveSummarySheet
                  bcg={bcg}
                  completed={completed}
                  conclusions={payload.conclusions}
                  group={group}
                  identity={identity}
                  plan={plan}
                  swot={swot}
                  formulation={formulation}
                  onConclusionsChange={(conclusions) => setPayload({ conclusions })}
                />
              </>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            disabled={loading || submitting || Boolean(pendingRequest) || completed}
            type="button"
            onClick={handleSendForReview}
          >
            <Send size={16} />
            {completed ? 'Consolidacion cerrada' : submitting ? 'Enviando...' : 'Enviar consolidacion a revision'}
          </button>
        </div>
      </div>

      <aside className="tools-panel">
        <div className="card-header">
          <BarChart3 size={18} />
          <h2>Consolidacion</h2>
        </div>
        <div className="gplan-side-body">
          <div className="diag-score-grid">
            <Metric label="FODA" value={swot ? 'Disponible' : 'Pendiente'} />
            <Metric label="CAME" value={formulation.came ? 'Disponible' : 'Pendiente'} />
            <Metric label="Conclusiones" value={payload.conclusions.trim() ? 'Listas' : 'Pendientes'} />
          </div>

          <div className="gplan-workflow-summary">
            <div className="gplan-workflow-title">
              <GitPullRequest size={16} />
              <span>Revision consolidacion</span>
            </div>
            {pendingRequest && (
              <div className="gplan-request-card">
                <strong>{pendingRequest.title}</strong>
                <span>Enviada {formatDate(pendingRequest.submittedAt ?? pendingRequest.updatedAt)}</span>
              </div>
            )}
            {!pendingRequest && activeDraft && (
              <div className="gplan-request-card">
                <strong>{activeDraft.title}</strong>
                <span>Borrador actualizado {formatDate(activeDraft.updatedAt)}</span>
              </div>
            )}
            {!pendingRequest && !activeDraft && <p className="gplan-muted">Revise el resumen y envie las conclusiones.</p>}
          </div>

        </div>
      </aside>
    </div>
  )
}

function ExecutiveSummarySheet({
  bcg,
  completed,
  conclusions,
  formulation,
  group,
  identity,
  onConclusionsChange,
  plan,
  swot,
}: {
  bcg: BcgSummary | null
  completed: boolean
  conclusions: string
  formulation: FormulationSnapshot
  group: PlanningGroupSummary | null
  identity: IdentitySectionSummary | null
  onConclusionsChange: (value: string) => void
  plan: PlanSummary
  swot: SwotSummary | null
}) {
  const actions = cameActions(formulation.came)
  const objectiveCount = identity?.objectives.length ?? 0
  const productCount = bcg?.products.length ?? 0
  const swotCount = swotItemCount(swot)
  const companyName = plan.profile.companyName || group?.name || 'Plan PETI'

  return (
    <section className="diag-panel wide cons-sheet">
      <header className="cons-hero">
        <div>
          <span>Consolidacion final</span>
          <h3>Resumen ejecutivo del plan estrategico</h3>
          <p>{companyName}</p>
        </div>
        <strong className={completed ? 'closed' : ''}>
          <CheckCircle2 size={18} />
          {completed ? 'Cerrada' : 'En elaboracion'}
        </strong>
      </header>

      <div className="cons-stat-grid">
        <SummaryStat icon={<Target size={18} />} label="Objetivos" value={String(objectiveCount)} />
        <SummaryStat icon={<Layers3 size={18} />} label="Hallazgos FODA" value={String(swotCount)} />
        <SummaryStat icon={<BarChart3 size={18} />} label="Productos BCG" value={String(productCount)} />
        <SummaryStat icon={<ClipboardList size={18} />} label="Acciones" value={String(actions.length)} />
      </div>

      <section className="cons-section">
        <SectionTitle icon={<FileText size={18} />} title="Datos generales" />
        <div className="cons-meta-grid">
          <MetaRow label="Empresa / proyecto" value={companyName} />
          <MetaRow label="Fecha de elaboracion" value={formatDate(plan.updatedAt)} />
          <MetaRow label="Promotores" value={promotersText(group)} />
        </div>
      </section>

      <section className="cons-section">
        <SectionTitle icon={<Target size={18} />} title="Identidad estrategica" />
        <div className="cons-two-col">
          <SheetBlock label="MISION" value={identity?.mission} tall />
          <SheetBlock label="VISION" value={identity?.vision} tall />
        </div>
        <SheetBlock label="VALORES" value={identity?.valuesText} />
        <SheetBlock label="UNIDADES ESTRATEGICAS" value={strategicUnitsText(plan, bcg)} tall />
      </section>

      <section className="cons-section">
        <SectionTitle icon={<ClipboardList size={18} />} title="Objetivos estrategicos" />
        <ObjectivesTable identity={identity} />
      </section>

      <section className="cons-section">
        <SectionTitle icon={<Layers3 size={18} />} title="Analisis FODA" />
        <SwotSheet swot={swot} />
      </section>

      <section className="cons-section">
        <SectionTitle icon={<GitPullRequest size={18} />} title="Estrategia y acciones" />
        <SheetBlock label="IDENTIFICACION DE ESTRATEGIA" value={strategyText(formulation.identification)} />
        <ActionsTable actions={actions} />
      </section>

      <section className="cons-section">
        <SectionTitle icon={<CheckCircle2 size={18} />} title="Conclusiones" />
        <div className="cons-conclusions">
          <textarea
            disabled={completed}
            placeholder="Anote las conclusiones mas relevantes de su Plan."
            rows={5}
            value={conclusions}
            onChange={(event) => onConclusionsChange(event.target.value)}
          />
        </div>
      </section>
    </section>
  )
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="cons-section-title">
      {icon}
      <h4>{title}</h4>
    </div>
  )
}

function SummaryStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="cons-stat">
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  )
}

function swotItemCount(swot: SwotSummary | null) {
  return (
    (swot?.strengths.length ?? 0)
    + (swot?.weaknesses.length ?? 0)
    + (swot?.opportunities.length ?? 0)
    + (swot?.threats.length ?? 0)
  )
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="cons-meta-row">
      <strong>{label}</strong>
      <span>{value || '-'}</span>
    </div>
  )
}

function SheetBlock({ label, tall, value }: { label: string; tall?: boolean; value?: string }) {
  return (
    <div className={`cons-block ${tall ? 'tall' : ''}`}>
      <div className="cons-label">{label}</div>
      <div className="cons-box">{value || '-'}</div>
    </div>
  )
}

function ObjectivesTable({ identity }: { identity: IdentitySectionSummary | null }) {
  const objectives = identity?.objectives ?? []
  return (
    <div className="cons-block">
      <div className="cons-label">OBJETIVOS ESTRATEGICOS</div>
      <table className="cons-table">
        <thead>
          <tr>
            <th>MISION</th>
            <th>OBJETIVOS GENERALES O ESTRATEGICOS</th>
            <th>OBJETIVOS ESPECIFICOS</th>
          </tr>
        </thead>
        <tbody>
          {objectives.length === 0 && <tr><td colSpan={3}>Sin objetivos registrados.</td></tr>}
          {objectives.map((objective, index) => (
            <tr key={`${objective.generalObjective}-${index}`}>
              {index === 0 && <td rowSpan={Math.max(1, objectives.length)}>{identity?.mission || '-'}</td>}
              <td>{objective.generalObjective || '-'}</td>
              <td>{objective.specificObjectives.filter(Boolean).join('; ') || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SwotSheet({ swot }: { swot: SwotSummary | null }) {
  return (
    <div className="cons-block">
      <div className="cons-label">ANALISIS FODA</div>
      <div className="cons-swot">
        <SwotBand className="weakness" label="DEBILIDADES" items={swot?.weaknesses} />
        <SwotBand className="threat" label="AMENAZAS" items={swot?.threats} />
        <SwotBand className="strength" label="FORTALEZAS" items={swot?.strengths} />
        <SwotBand className="opportunity" label="OPORTUNIDADES" items={swot?.opportunities} />
      </div>
    </div>
  )
}

function SwotBand({ className, items, label }: { className: string; items?: Array<{ description: string }>; label: string }) {
  const values = items?.map((item) => item.description).filter(Boolean) ?? []
  return (
    <div className={`cons-swot-row ${className}`}>
      <strong>{label}</strong>
      <div>
        {(values.length ? values : ['-']).map((item, index) => <span key={`${label}-${index}`}>{item}</span>)}
      </div>
    </div>
  )
}

function ActionsTable({ actions }: { actions: string[] }) {
  return (
    <div className="cons-block actions">
      <div className="cons-label">ACCIONES COMPETITIVAS</div>
      <table className="cons-actions">
        <tbody>
          {actions.length === 0 && (
            <tr>
              <td colSpan={2}>Sin acciones competitivas registradas.</td>
            </tr>
          )}
          {actions.map((action, index) => (
            <tr key={index}>
              <th>{index + 1}</th>
              <td>{action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function strategicUnitsText(plan: PlanSummary, bcg: BcgSummary | null) {
  return [plan.profile.businessLine, ...(bcg?.products.map((product) => product.name) ?? [])]
    .filter(Boolean)
    .join('\n')
}

function promotersText(group: PlanningGroupSummary | null) {
  return group?.members.map((member) => `${member.firstName} ${member.lastName}`).join(', ')
}

function strategyText(identification: StrategyIdentificationPayload | null) {
  const selected = identification?.selectedStrategy
  return selected ? `${selected} - ${relationLabels[selected]}` : ''
}

function cameActions(came: CamePayload | null) {
  if (!came) return []
  return Object.values(came)
    .flat()
    .filter((action) => action.action)
    .map((action) => action.action)
}

function consolidationChangeRequestPayload(
  consolidation: ConsolidationPayload,
  entries: PhaseChangeEntry[],
): CreatePhaseChangeRequestPayload {
  return {
    title: 'Aprobar consolidacion',
    description: 'Solicitud para cerrar el resumen ejecutivo final del PETI.',
    proposedContent: { consolidation },
    entries,
  }
}

function consolidationEntries(current: ConsolidationPayload, next: ConsolidationPayload): PhaseChangeEntry[] {
  const previousValue = stringify(current)
  const proposedValue = stringify(next)
  return previousValue === proposedValue ? [] : [{ fieldKey: 'consolidation', previousValue, proposedValue }]
}

function cleanConsolidation(payload: ConsolidationPayload): ConsolidationPayload {
  return { conclusions: textValue(payload.conclusions) }
}

function consolidationFromContent(content: Record<string, unknown>): ConsolidationPayload {
  const source = recordValue(content.consolidation)
  return source ? { conclusions: textValue(source.conclusions) } : emptyConsolidation
}

function formulationSnapshot(versions: PhaseVersionSummary[]): FormulationSnapshot {
  const source = versions.find((version) => recordValue(version.content.strategyIdentification))?.content
  const cameSource = versions.find((version) => recordValue(version.content.came))?.content
  return {
    identification: source ? strategyIdentificationFromUnknown(source.strategyIdentification) : null,
    came: cameSource ? cameFromUnknown(cameSource.came) : null,
  }
}

function strategyIdentificationFromUnknown(value: unknown): StrategyIdentificationPayload | null {
  const source = recordValue(value)
  if (!source) return null
  return {
    strengths: [],
    opportunities: [],
    weaknesses: [],
    threats: [],
    scores: { FO: [], AF: [], AD: [], OD: [] },
    selectedStrategy: relationValue(source.selectedStrategy),
  }
}

function cameFromUnknown(value: unknown): CamePayload | null {
  const source = recordValue(value)
  if (!source) return null
  return {
    correctWeaknesses: actionsFromUnknown(source.correctWeaknesses),
    faceThreats: actionsFromUnknown(source.faceThreats),
    maintainStrengths: actionsFromUnknown(source.maintainStrengths),
    exploitOpportunities: actionsFromUnknown(source.exploitOpportunities),
  }
}

function actionsFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({ relatedItem: textValue(item.relatedItem), action: textValue(item.action) }))
    : []
}

function relationValue(value: unknown): StrategyRelation | '' {
  return value === 'FO' || value === 'AF' || value === 'AD' || value === 'OD' ? value : ''
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gplan-dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
