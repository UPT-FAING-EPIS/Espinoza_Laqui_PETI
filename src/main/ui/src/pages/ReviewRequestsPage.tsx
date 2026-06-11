import {
  CheckCircle2,
  CircleAlert,
  Eye,
  GitPullRequest,
  History,
  RefreshCcw,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { listGroups, listMyGroups } from '../api/groupApi'
import {
  approvePhaseChangeRequest,
  listPhaseChangeRequests,
  rejectPhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import '../App.css'
import './ReviewRequestsPage.css'
import type {
  GroupMemberSummary,
  PetiPhase,
  PhaseChangeRequestSummary,
  PhaseChangeStatus,
  PlanningGroupSummary,
} from '../types'

type ReviewFilter = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ALL'

type ReviewQueueItem = {
  group: PlanningGroupSummary
  key: string
  request: PhaseChangeRequestSummary
  requester: GroupMemberSummary | null
}

const reviewPhases: PetiPhase[] = ['IDENTITY', 'DIAGNOSTICS', 'FORMULATION', 'CONSOLIDATION']

const phaseLabels: Record<PetiPhase, string> = {
  CONSOLIDATION: 'Consolidacion',
  DIAGNOSTICS: 'Diagnosticos',
  FORMULATION: 'Formulacion',
  IDENTITY: 'Identidad estrategica',
}

const statusLabels: Record<PhaseChangeStatus, string> = {
  APPROVED: 'Aprobada',
  DRAFT: 'Borrador',
  PENDING_APPROVAL: 'Pendiente',
  REJECTED: 'Rechazada',
}

const fieldLabels: Record<string, string> = {
  assessments: 'Valoraciones',
  bcg: 'BCG',
  businessLine: 'Rubro',
  companyName: 'Empresa',
  description: 'Descripcion',
  marketGrowthThreshold: 'Umbral crecimiento',
  mission: 'Mision',
  objectives: 'Objetivos',
  observations: 'Observaciones',
  opportunities: 'Oportunidades',
  primaryActivities: 'Actividades primarias',
  products: 'Productos',
  relativeMarketShareThreshold: 'Umbral participacion',
  strengths: 'Fortalezas',
  supportActivities: 'Actividades de apoyo',
  threats: 'Amenazas',
  valuesText: 'Valores',
  valueChain: 'Cadena de valor',
  vision: 'Vision',
  weaknesses: 'Debilidades',
}

const filters: Array<{ label: string; value: ReviewFilter }> = [
  { label: 'Pendientes', value: 'PENDING_APPROVAL' },
  { label: 'Aprobadas', value: 'APPROVED' },
  { label: 'Rechazadas', value: 'REJECTED' },
  { label: 'Todas', value: 'ALL' },
]

export default function ReviewRequestsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ReviewQueueItem[]>([])
  const [filter, setFilter] = useState<ReviewFilter>('PENDING_APPROVAL')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const groups = user.role === 'ADMINISTRADOR' ? await listGroups() : await listMyGroups()
      const reviewableGroups = user.role === 'ADMINISTRADOR'
        ? groups
        : groups.filter((group) => group.members.some((member) => member.userId === user.id && member.role === 'LIDER'))

      const responses = await Promise.all(reviewableGroups.flatMap((group) =>
        reviewPhases.map(async (phase) => {
          try {
            const requests = await listPhaseChangeRequests(group.id, phase)
            return requests
              .filter((request) => request.status !== 'DRAFT')
              .map((request) => ({
                group,
                key: `${group.id}-${phase}-${request.id}`,
                request,
                requester: group.members.find((member) => member.userId === request.createdByUserId) ?? null,
              }))
          } catch {
            return []
          }
        }),
      ))

      const nextItems = responses
        .flat()
        .sort((a, b) => timestamp(b.request.submittedAt ?? b.request.updatedAt) - timestamp(a.request.submittedAt ?? a.request.updatedAt))
      setItems(nextItems)
      setSelectedKey((current) => {
        if (current && nextItems.some((item) => item.key === current)) return current
        return nextItems[0]?.key ?? null
      })
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudieron cargar las solicitudes.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const visibleItems = useMemo(
    () => items.filter((item) => filter === 'ALL' || item.request.status === filter),
    [filter, items],
  )
  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.key === selectedKey) ?? visibleItems[0] ?? null,
    [selectedKey, visibleItems],
  )
  const pendingCount = items.filter((item) => item.request.status === 'PENDING_APPROVAL').length

  async function handleReview(item: ReviewQueueItem, approved: boolean) {
    setActionKey(`${item.key}-${approved ? 'approve' : 'reject'}`)
    setError(null)
    setNotice(null)
    try {
      const payload = { comment: reviewComment.trim() }
      if (approved) {
        await approvePhaseChangeRequest(item.group.id, item.request.phase, item.request.id, payload)
      } else {
        await rejectPhaseChangeRequest(item.group.id, item.request.phase, item.request.id, payload)
      }
      setReviewComment('')
      setNotice(approved ? 'Solicitud aprobada. Los cambios ya fueron aplicados al plan.' : 'Solicitud rechazada.')
      await load()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'No se pudo revisar la solicitud.')
    } finally {
      setActionKey(null)
    }
  }

  return (
    <div className="requests-page">
      <header className="requests-header">
        <div>
          <h1>Solicitudes de cambio</h1>
          <p>Revision de propuestas enviadas por los miembros del plan PETI.</p>
        </div>
        <button className="btn btn-secondary" type="button" onClick={load} disabled={loading}>
          <RefreshCcw size={16} />
          Actualizar
        </button>
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

      <section className="requests-summary">
        <div className="requests-summary-main">
          <GitPullRequest size={20} />
          <span>
            <strong>{pendingCount}</strong>
            <small>pendiente{pendingCount !== 1 ? 's' : ''} por revisar</small>
          </span>
        </div>
        <div className="requests-filters" role="tablist" aria-label="Filtro de solicitudes">
          {filters.map((item) => (
            <button
              className={filter === item.value ? 'active' : ''}
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <div className="requests-grid">
        <section className="requests-list-card">
          <div className="requests-list-head">
            <h2>Cola de revision</h2>
            <span>{visibleItems.length} registro{visibleItems.length !== 1 ? 's' : ''}</span>
          </div>

          {loading && <p className="gplan-muted">Cargando solicitudes...</p>}
          {!loading && visibleItems.length === 0 && (
            <div className="requests-empty">
              <History size={34} />
              <strong>Sin solicitudes</strong>
              <span>No hay registros para el filtro seleccionado.</span>
            </div>
          )}

          {!loading && visibleItems.map((item) => (
            <button
              className={`request-row ${selectedItem?.key === item.key ? 'active' : ''}`}
              key={item.key}
              type="button"
              onClick={() => setSelectedKey(item.key)}
            >
              <div className="request-row-top">
                <span className={`gplan-status gplan-status--${item.request.status.toLowerCase()}`}>
                  {statusLabels[item.request.status]}
                </span>
                <small>{formatDate(item.request.submittedAt ?? item.request.updatedAt)}</small>
              </div>
              <strong>{item.request.title}</strong>
              <span>{requesterName(item.request, item.requester)} / {phaseLabels[item.request.phase]}</span>
              <div className="request-field-tags">
                {changedFieldLabels(item.request).slice(0, 3).map((field) => (
                  <small key={field}>{field}</small>
                ))}
              </div>
            </button>
          ))}
        </section>

        <section className="request-detail-card">
          {!selectedItem && (
            <div className="requests-empty detail">
              <Eye size={34} />
              <strong>Seleccione una solicitud</strong>
              <span>El detalle mostrara usuario, fase y campos modificados.</span>
            </div>
          )}

          {selectedItem && (
            <>
              <div className="request-detail-header">
                <div>
                  <span className="request-kicker">Detalle de solicitud</span>
                  <h2>{selectedItem.request.title}</h2>
                  <p>{selectedItem.request.description || 'Sin descripcion adicional.'}</p>
                </div>
                <span className={`gplan-status gplan-status--${selectedItem.request.status.toLowerCase()}`}>
                  {statusLabels[selectedItem.request.status]}
                </span>
              </div>

              <div className="request-meta-grid">
                <ReviewMetric label="Usuario" value={requesterName(selectedItem.request, selectedItem.requester)} />
                <ReviewMetric label="Grupo" value={selectedItem.group.name} />
                <ReviewMetric label="Fase" value={phaseLabels[selectedItem.request.phase]} />
              </div>

              <div className="request-section">
                <h3>Campos modificados</h3>
                <div className="request-field-tags expanded">
                  {changedFieldLabels(selectedItem.request).map((field) => (
                    <small key={field}>{field}</small>
                  ))}
                </div>
              </div>

              <div className="request-section">
                <h3>Comparacion</h3>
                {selectedItem.request.entries.length === 0 && (
                  <p className="gplan-muted">La solicitud no tiene campos detallados registrados.</p>
                )}
                <div className="request-diff-list">
                  {selectedItem.request.entries.map((entry) => (
                    <article className="request-diff-card" key={entry.fieldKey}>
                      <strong>{fieldLabel(entry.fieldKey)}</strong>
                      <div className="request-diff-grid">
                        <DiffValue fieldKey={entry.fieldKey} label="Antes" value={entry.previousValue} />
                        <DiffValue fieldKey={entry.fieldKey} label="Propuesto" value={entry.proposedValue} />
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="request-section">
                <label className="field">
                  <span className="field-label">Comentario de revision</span>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Observacion opcional para el equipo"
                    disabled={selectedItem.request.status !== 'PENDING_APPROVAL'}
                  />
                </label>
              </div>

              {selectedItem.request.status === 'PENDING_APPROVAL' && (
                <footer className="request-actions">
                  <button
                    className="gplan-review-btn reject"
                    type="button"
                    disabled={Boolean(actionKey)}
                    onClick={() => handleReview(selectedItem, false)}
                  >
                    <XCircle size={15} />
                    Rechazar
                  </button>
                  <button
                    className="gplan-review-btn approve"
                    type="button"
                    disabled={Boolean(actionKey)}
                    onClick={() => handleReview(selectedItem, true)}
                  >
                    <ShieldCheck size={15} />
                    Aprobar y aplicar
                  </button>
                </footer>
              )}

              {selectedItem.request.status !== 'PENDING_APPROVAL' && (
                <div className="request-reviewed">
                  <Send size={15} />
                  <span>
                    Revisada {formatDate(selectedItem.request.reviewedAt)} por {reviewerName(selectedItem)}
                  </span>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gplan-dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function DiffValue({ fieldKey, label, value }: { fieldKey: string; label: string; value: string }) {
  return (
    <div className="request-diff-value">
      <span>{label}</span>
      <FormattedDiffValue fieldKey={fieldKey} value={value} />
    </div>
  )
}

function FormattedDiffValue({ fieldKey, value }: { fieldKey: string; value: string }) {
  const parsed = parseJsonValue(value)

  if (!value) {
    return <p>-</p>
  }

  if (fieldKey === 'objectives' && Array.isArray(parsed)) {
    return <ObjectivesDiff value={parsed} />
  }

  if (Array.isArray(parsed)) {
    return (
      <ul className="request-structured-list">
        {parsed.map((item, index) => (
          <li key={index}>{summaryText(item)}</li>
        ))}
      </ul>
    )
  }

  if (isRecord(parsed)) {
    const entries = Object.entries(parsed).filter(([, item]) => item !== undefined && item !== null && item !== '')
    return (
      <dl className="request-structured-object">
        {entries.map(([key, item]) => (
          <div key={key}>
            <dt>{fieldLabel(key)}</dt>
            <dd>{summaryText(item)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return <p>{String(parsed ?? value)}</p>
}

function ObjectivesDiff({ value }: { value: unknown[] }) {
  const objectives = value.filter(isRecord)

  if (objectives.length === 0) {
    return <p>Sin objetivos registrados.</p>
  }

  return (
    <div className="request-objective-list">
      {objectives.map((objective, index) => {
        const specifics = Array.isArray(objective.specificObjectives)
          ? objective.specificObjectives.map((item) => String(item)).filter(Boolean)
          : []

        return (
          <article className="request-objective-item" key={`${textValue(objective.generalObjective)}-${index}`}>
            <strong>{textValue(objective.generalObjective) || `Objetivo ${index + 1}`}</strong>
            {specifics.length > 0 && (
              <ul>
                {specifics.map((specific, specificIndex) => (
                  <li key={`${specific}-${specificIndex}`}>{specific}</li>
                ))}
              </ul>
            )}
          </article>
        )
      })}
    </div>
  )
}

function changedFieldLabels(request: PhaseChangeRequestSummary) {
  const keys = request.entries.length > 0 ? request.entries.map((entry) => entry.fieldKey) : Object.keys(request.proposedContent)
  const uniqueKeys = Array.from(new Set(keys))
  return uniqueKeys.length > 0 ? uniqueKeys.map(fieldLabel) : ['Contenido']
}

function fieldLabel(key: string) {
  return fieldLabels[key] ?? key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .trim()
}

function requesterName(request: PhaseChangeRequestSummary, member: GroupMemberSummary | null) {
  return member ? `${member.firstName} ${member.lastName}` : `Usuario #${request.createdByUserId}`
}

function reviewerName(item: ReviewQueueItem) {
  const reviewer = item.group.members.find((member) => member.userId === item.request.reviewedByUserId)
  if (reviewer) return `${reviewer.firstName} ${reviewer.lastName}`
  return item.request.reviewedByUserId ? `Usuario #${item.request.reviewedByUserId}` : '-'
}

function timestamp(value?: string | null) {
  return value ? new Date(value).getTime() : 0
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function parseJsonValue(value: string) {
  if (!value.trim()) return null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function summaryText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(summaryText).filter(Boolean).join(', ')
  }
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([key, item]) => key !== 'complete' && item !== undefined && item !== null && item !== '')
      .map(([key, item]) => `${fieldLabel(key)}: ${summaryText(item)}`)
      .join(' | ')
  }
  return value === undefined || value === null ? '-' : String(value)
}
