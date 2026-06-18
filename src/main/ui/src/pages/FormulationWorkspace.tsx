import {
  BarChart3,
  FileText,
  GitPullRequest,
  History,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPhaseChangeRequest,
  getGroupPlanSwot,
  listPhaseChangeRequests,
  listPhaseVersions,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import {
  arrayValue,
  normalizeTextKey,
  recordValue,
  textValue,
} from '../utils/normalizers'
import type {
  CreatePhaseChangeRequestPayload,
  CameActionPayload,
  CamePayload,
  DiagnosticPriority,
  PhaseChangeEntry,
  PhaseChangeRequestSummary,
  PhaseVersionSummary,
  PlanningGroupSummary,
  PlanSummary,
  StrategyIdentificationPayload,
  StrategyRelation,
  SwotItemPayload,
  SwotItemSummary,
  SwotSummary,
} from '../types'
import './DiagnosticsWorkspace.css'
import './FormulationWorkspace.css'

const relationConfig: Array<{
  description: string
  label: string
  relation: StrategyRelation
  strategy: string
}> = [
  {
    relation: 'FO',
    label: 'Fortalezas / Oportunidades',
    strategy: 'Estrategia Ofensiva',
    description: 'Debera adoptar estrategias de crecimiento',
  },
  {
    relation: 'AF',
    label: 'Amenazas / Fortalezas',
    strategy: 'Estrategia Defensiva',
    description: 'La empresa esta preparada para enfrentarse a las amenazas',
  },
  {
    relation: 'AD',
    label: 'Amenazas / Debilidades',
    strategy: 'Estrategia de Supervivencia',
    description: 'Se enfrenta a amenazas externas sin las fortalezas necesarias para luchar con la competencia',
  },
  {
    relation: 'OD',
    label: 'Oportunidades / Debilidades',
    strategy: 'Estrategia de Reorientacion',
    description: 'La empresa no puede aprovechar las oportunidades porque carece de preparacion adecuada',
  },
]

type CameKey = keyof CamePayload
type SwotListKey = 'strengths' | 'opportunities' | 'weaknesses' | 'threats'

const cameSections: Array<{
  code: 'C' | 'A' | 'M' | 'E'
  copy: string
  key: CameKey
  prefix: string
  sourceKey: SwotListKey
  sourceTitle: string
  title: string
}> = [
  {
    code: 'C',
    key: 'correctWeaknesses',
    title: 'Corregir las debilidades',
    sourceKey: 'weaknesses',
    sourceTitle: 'Debilidad',
    prefix: 'D',
    copy: 'Acciones para reducir las debilidades que limitan la estrategia elegida.',
  },
  {
    code: 'A',
    key: 'faceThreats',
    title: 'Afrontar las amenazas',
    sourceKey: 'threats',
    sourceTitle: 'Amenaza',
    prefix: 'A',
    copy: 'Acciones para responder a las amenazas del entorno.',
  },
  {
    code: 'M',
    key: 'maintainStrengths',
    title: 'Mantener las fortalezas',
    sourceKey: 'strengths',
    sourceTitle: 'Fortaleza',
    prefix: 'F',
    copy: 'Acciones para sostener las fortalezas que respaldan la estrategia.',
  },
  {
    code: 'E',
    key: 'exploitOpportunities',
    title: 'Explotar las oportunidades',
    sourceKey: 'opportunities',
    sourceTitle: 'Oportunidad',
    prefix: 'O',
    copy: 'Acciones para aprovechar las oportunidades detectadas en el FODA.',
  },
]

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']
const scoreOptions = [0, 1, 2, 3, 4]
const emptyIdentification: StrategyIdentificationPayload = {
  strengths: [],
  opportunities: [],
  weaknesses: [],
  threats: [],
  scores: emptyScores(),
  selectedStrategy: '',
}
const emptyCamePayload: CamePayload = emptyCame()

export function FormulationWorkspace({
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
  const [swotSummary, setSwotSummary] = useState<SwotSummary | null>(null)
  const [identification, setIdentification] = useState<StrategyIdentificationPayload>(emptyIdentification)
  const [came, setCame] = useState<CamePayload>(emptyCamePayload)
  const [changes, setChanges] = useState<PhaseChangeRequestSummary[]>([])
  const [versions, setVersions] = useState<PhaseVersionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)

  const pendingRequest = useMemo(
    () => changes.find((change) => change.status === 'PENDING_APPROVAL') ?? null,
    [changes],
  )
  const activeDraft = useMemo(
    () => changes.find((change) => change.status === 'DRAFT' && change.createdByUserId === user?.id) ?? null,
    [changes, user?.id],
  )
  const latestVersion = versions[0] ?? null
  const swotPayload = useMemo(
    () => swotSummary ? swotPayloadFromSummary(swotSummary) : emptyIdentification,
    [swotSummary],
  )
  const latestIdentificationVersion = useMemo(
    () => versions.find((version) => hasStrategyIdentificationContent(version.content)) ?? null,
    [versions],
  )
  const latestCameVersion = useMemo(
    () => versions.find((version) => hasCameContent(version.content)) ?? null,
    [versions],
  )
  const approvedIdentification = useMemo(
    () => latestIdentificationVersion
      ? strategyIdentificationFromContent(latestIdentificationVersion.content, swotPayload)
      : null,
    [latestIdentificationVersion, swotPayload],
  )
  const results = strategyResults(identification)
  const maxScore = Math.max(0, ...results.map((item) => item.score))
  const selectedResult = results.find((item) => item.relation === identification.selectedStrategy) ?? null
  const workflowBusy = workflowAction !== null
  const swotReady = hasCompleteSwot(swotPayload)
  const formulationCompleted = plan.phases.find((phase) => phase.phase === 'FORMULATION')?.completed ?? false
  const cameReady = Boolean(approvedIdentification)
  const formulationClosed = formulationCompleted || Boolean(latestCameVersion)
  const cameActionCount = cameActionsCount(came)

  const load = useCallback(async () => {
    setLoading(true)
    onError(null)
    try {
      const [nextSwot, nextChanges, nextVersions] = await Promise.all([
        getGroupPlanSwot(groupId),
        listPhaseChangeRequests(groupId, 'FORMULATION'),
        listPhaseVersions(groupId, 'FORMULATION'),
      ])
      const nextSwotPayload = swotPayloadFromSummary(nextSwot)
      const draft = nextChanges.find((change) => change.status === 'DRAFT' && change.createdByUserId === user?.id)
      const identificationVersion = nextVersions.find((version) => hasStrategyIdentificationContent(version.content))
      const cameVersion = nextVersions.find((version) => hasCameContent(version.content))
      const baseIdentification = identificationVersion
        ? strategyIdentificationFromContent(identificationVersion.content, nextSwotPayload)
        : strategyIdentificationFromSwot(nextSwotPayload)
      const nextIdentification = draft
        ? strategyIdentificationFromContent(draft.proposedContent, baseIdentification)
        : baseIdentification
      const nextCame = draft && hasCameContent(draft.proposedContent)
        ? cameFromContent(draft.proposedContent, nextIdentification)
        : cameVersion
          ? cameFromContent(cameVersion.content, nextIdentification)
          : cameFromIdentification(nextIdentification)
      setSwotSummary(nextSwot)
      setChanges(nextChanges)
      setVersions(nextVersions)
      setIdentification(nextIdentification)
      setCame(nextCame)
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo cargar la formulacion estrategica.')
    } finally {
      setLoading(false)
    }
  }, [groupId, onError, user?.id])

  useEffect(() => {
    load()
  }, [load])

  function updateScore(relation: StrategyRelation, row: number, column: number, score: number) {
    setIdentification((current) => {
      const nextScores = cloneScores(current.scores)
      const matrix = nextScores[relation]
      matrix[row] = [...(matrix[row] ?? [])]
      matrix[row][column] = score
      return normalizeSelection({ ...current, scores: nextScores })
    })
  }

  function selectStrategy(relation: StrategyRelation) {
    setIdentification((current) => normalizeSelection({ ...current, selectedStrategy: relation }))
  }

  function loadVersion(version: PhaseVersionSummary) {
    const nextIdentification = strategyIdentificationFromContent(version.content, swotPayload)
    setIdentification(nextIdentification)
    setCame(cameFromContent(version.content, nextIdentification))
    onNotice(`Formulacion v${version.versionNumber} cargada en el editor.`)
    onError(null)
  }

  async function handleSendForReview() {
    if (cameReady) {
      await handleSendCameForReview()
      return
    }
    await handleSendIdentificationForReview()
  }

  async function handleSendIdentificationForReview() {
    if (pendingRequest) {
      onError('Ya existe una solicitud pendiente para formulacion. Espere la revision del lider.')
      return
    }
    const payload = cleanStrategyIdentification(identification)
    const validation = validateIdentification(payload)
    if (validation) {
      onError(validation)
      return
    }
    const current = latestVersion
      ? strategyIdentificationFromContent(latestVersion.content, swotPayload)
      : strategyIdentificationFromSwot(swotPayload)
    const entries = formulationEntries(current, payload)
    if (entries.length === 0) {
      onError('No hay cambios para enviar a revision.')
      return
    }

    setWorkflowAction('submit-formulation')
    onError(null)
    onNotice(null)
    try {
      const requestPayload = formulationChangeRequestPayload(payload, entries)
      const request = activeDraft
        ? await updatePhaseChangeRequest(groupId, 'FORMULATION', activeDraft.id, requestPayload)
        : await createPhaseChangeRequest(groupId, 'FORMULATION', requestPayload)
      await submitPhaseChangeRequest(groupId, 'FORMULATION', request.id)
      await load()
      onNotice('Identificacion de estrategias enviada a revision del lider.')
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo enviar la formulacion a revision.')
    } finally {
      setWorkflowAction(null)
    }
  }

  async function handleSendCameForReview() {
    if (pendingRequest) {
      onError('Ya existe una solicitud pendiente para formulacion. Espere la revision del lider.')
      return
    }
    if (!approvedIdentification) {
      onError('Apruebe primero la identificacion de estrategias.')
      return
    }
    const identificationPayload = cleanStrategyIdentification(approvedIdentification)
    const payload = cleanCame(came)
    const validation = validateCame(payload)
    if (validation) {
      onError(validation)
      return
    }
    const current = latestCameVersion
      ? cameFromContent(latestCameVersion.content, identificationPayload)
      : cameFromIdentification(identificationPayload)
    const entries = cameEntries(current, payload)
    if (entries.length === 0) {
      onError('No hay cambios CAME para enviar a revision.')
      return
    }

    setWorkflowAction('submit-came')
    onError(null)
    onNotice(null)
    try {
      const requestPayload = cameChangeRequestPayload(identificationPayload, payload, entries)
      const request = activeDraft
        ? await updatePhaseChangeRequest(groupId, 'FORMULATION', activeDraft.id, requestPayload)
        : await createPhaseChangeRequest(groupId, 'FORMULATION', requestPayload)
      await submitPhaseChangeRequest(groupId, 'FORMULATION', request.id)
      await load()
      onNotice('Matriz CAME enviada a revision del lider.')
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo enviar la matriz CAME a revision.')
    } finally {
      setWorkflowAction(null)
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
            <FormulationMetric label="Grupo" value={group?.name ?? '-'} />
            <FormulationMetric label="Plan" value={plan.id ? `#${plan.id}` : '-'} />
            <FormulationMetric label="FODA" value={swotReady ? 'Aprobado' : 'Pendiente'} />
            <FormulationMetric label="Identificacion" value={cameReady ? 'Aprobada' : 'Pendiente'} />
            <FormulationMetric label="CAME" value={latestCameVersion ? 'Aprobada' : 'Pendiente'} />
          </div>
        </section>

        <section className="card diag-workspace">
          <div className="card-header gplan-card-header-action">
            <div className="gplan-card-title">
              <ShieldCheck size={18} />
              <h2>Identificacion de estrategias</h2>
            </div>
          </div>
          <div className="diag-body formu-body">
            {loading && <p className="gplan-muted">Cargando formulacion...</p>}
            {!loading && !swotReady && (
              <section className="diag-panel wide">
                <div className="diag-panel-head">
                  <h3>FODA requerido</h3>
                </div>
                <p className="gplan-muted">Apruebe la matriz FODA final antes de identificar estrategias.</p>
              </section>
            )}
            {!loading && swotReady && (
              <>
                <SwotSourcePanel payload={identification} />
                {relationConfig.map((relation) => (
                  <StrategyMatrix
                    key={relation.relation}
                    disabled={cameReady || formulationClosed}
                    payload={identification}
                    relation={relation.relation}
                    title={relation.label}
                    onScoreChange={updateScore}
                  />
                ))}
                <StrategySummary
                  disabled={cameReady || formulationClosed}
                  maxScore={maxScore}
                  payload={identification}
                  results={results}
                  onSelect={selectStrategy}
                />
                {cameReady && (
                  <CameEditor
                    disabled={formulationClosed}
                    identification={approvedIdentification ?? identification}
                    payload={came}
                    onChange={setCame}
                  />
                )}
                {!cameReady && (
                  <section className="diag-panel wide">
                    <div className="diag-panel-head">
                      <h3>Matriz CAME</h3>
                    </div>
                    <p className="gplan-muted">Apruebe primero la identificacion de estrategias para habilitar CAME.</p>
                  </section>
                )}
              </>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button
            className="btn btn-primary"
            type="button"
            disabled={loading || workflowBusy || Boolean(pendingRequest) || !swotReady || formulationClosed}
            onClick={handleSendForReview}
          >
            <Send size={16} />
            {formulationClosed
              ? 'Formulacion cerrada'
              : workflowAction === 'submit-came'
                ? 'Enviando CAME...'
                : workflowAction === 'submit-formulation'
                  ? 'Enviando identificacion...'
                  : cameReady
                    ? 'Enviar CAME a revision'
                    : 'Enviar identificacion a revision'}
          </button>
        </div>
      </div>

      <aside className="tools-panel">
        <div className="card-header">
          <BarChart3 size={18} />
          <h2>Formulacion</h2>
        </div>
        <div className="gplan-side-body">
          <div className="diag-score-grid">
            <FormulationMetric label="Mayor puntaje" value={String(maxScore)} />
            <FormulationMetric label="Seleccion" value={selectedResult?.strategy ?? '-'} />
            <FormulationMetric label="Acciones CAME" value={cameReady ? String(cameActionCount) : '-'} />
          </div>

          <div className="gplan-workflow-summary">
            <div className="gplan-workflow-title">
              <GitPullRequest size={16} />
              <span>Revision formulacion</span>
            </div>
            {pendingRequest && (
              <div className="gplan-request-card">
                <strong>{pendingRequest.title}</strong>
                <span>Enviada {formatDate(pendingRequest.submittedAt ?? pendingRequest.updatedAt)}</span>
                <span>Disponible para revision en Solicitudes.</span>
              </div>
            )}
            {!pendingRequest && activeDraft && (
              <div className="gplan-request-card">
                <strong>{activeDraft.title}</strong>
                <span>Borrador actualizado {formatDate(activeDraft.updatedAt)}</span>
              </div>
            )}
            {!pendingRequest && !activeDraft && (
              <p className="gplan-muted">Puntue las relaciones y envie la estrategia a revision.</p>
            )}
          </div>

          <div className="gplan-history-block">
            <div className="gplan-workflow-title">
              <History size={16} />
              <span>Versiones de formulacion</span>
            </div>
            {versions.length === 0 && <p className="gplan-muted">Sin versiones aprobadas en formulacion.</p>}
            {versions.map((version) => {
              const payload = strategyIdentificationFromContent(version.content, swotPayload)
              const winner = strategyResults(payload).find((item) => item.relation === payload.selectedStrategy)
              const versionHasCame = hasCameContent(version.content)
              return (
                <button
                  className="gplan-overview-card"
                  key={version.id}
                  type="button"
                  onClick={() => loadVersion(version)}
                >
                  <FileText size={16} />
                  <span>
                    <strong>v{version.versionNumber} - {versionHasCame ? 'Matriz CAME' : winner?.strategy ?? 'Identificacion'}</strong>
                    <small>{formatDate(version.approvedAt)} - {userNameById(group, version.createdByUserId)}</small>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}

function SwotSourcePanel({ payload }: { payload: StrategyIdentificationPayload }) {
  const sections = [
    { key: 'strengths' as const, title: 'Fortalezas', prefix: 'F' },
    { key: 'opportunities' as const, title: 'Oportunidades', prefix: 'O' },
    { key: 'weaknesses' as const, title: 'Debilidades', prefix: 'D' },
    { key: 'threats' as const, title: 'Amenazas', prefix: 'A' },
  ]
  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <div>
          <h3>FODA aprobado</h3>
          <p className="diag-panel-copy">Estos resultados vienen de la matriz FODA final y alimentan las matrices de estrategia.</p>
        </div>
      </div>
      <div className="diag-swot-source-grid">
        {sections.map((section) => (
          <article className="diag-swot-source-group" key={section.key}>
            <div className="diag-swot-source-head">
              <strong>{section.title}</strong>
              <span>{payload[section.key].length}</span>
            </div>
            {payload[section.key].map((item, index) => (
              <div className="diag-swot-source-item" key={`${section.key}-${index}`}>
                <div>
                  <strong>{section.prefix}{index + 1}. {item.description}</strong>
                </div>
                <em className={`diag-priority-pill ${item.priority.toLowerCase()}`}>{item.priority}</em>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  )
}

function StrategyMatrix({
  disabled,
  onScoreChange,
  payload,
  relation,
  title,
}: {
  disabled: boolean
  onScoreChange: (relation: StrategyRelation, row: number, column: number, score: number) => void
  payload: StrategyIdentificationPayload
  relation: StrategyRelation
  title: string
}) {
  const rows = relationRows(relation, payload)
  const columns = relationColumns(relation, payload)
  const rowPrefix = relation === 'FO' || relation === 'AF' ? 'F' : 'D'
  const columnPrefix = relation === 'FO' || relation === 'OD' ? 'O' : 'A'
  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <div>
          <h3>{relation} - {title}</h3>
          <p className="diag-panel-copy">{relationHelp(relation)}</p>
        </div>
        <span className="diag-pest-progress">Total {relationTotal(payload, relation)}</span>
      </div>
      <div className="diag-bcg-table-wrap">
        <table className="diag-bcg-table formu-strategy-table">
          <thead>
            <tr>
              <th>{rowPrefix === 'F' ? 'Fortalezas' : 'Debilidades'}</th>
              {columns.map((_, index) => <th key={index}>{columnPrefix}{index + 1}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${relation}-row-${rowIndex}`}>
                <th>
                  <strong>{rowPrefix}{rowIndex + 1}</strong>
                  <span>{row.description}</span>
                </th>
                {columns.map((_, columnIndex) => (
                  <td key={`${relation}-${rowIndex}-${columnIndex}`}>
                    <select
                      aria-label={`${relation} ${rowPrefix}${rowIndex + 1} ${columnPrefix}${columnIndex + 1}`}
                      disabled={disabled}
                      value={scoreAt(payload, relation, rowIndex, columnIndex)}
                      onChange={(event) => onScoreChange(relation, rowIndex, columnIndex, Number(event.target.value))}
                    >
                      {scoreOptions.map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                  </td>
                ))}
                <td className="diag-bcg-number">{rowTotal(payload, relation, rowIndex)}</td>
              </tr>
            ))}
            <tr className="diag-bcg-total-row">
              <th>Total</th>
              {columns.map((_, index) => (
                <td className="diag-bcg-number" key={`${relation}-total-${index}`}>{columnTotal(payload, relation, index)}</td>
              ))}
              <td className="diag-bcg-number">{relationTotal(payload, relation)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StrategySummary({
  disabled,
  maxScore,
  onSelect,
  payload,
  results,
}: {
  disabled: boolean
  maxScore: number
  onSelect: (relation: StrategyRelation) => void
  payload: StrategyIdentificationPayload
  results: StrategyResult[]
}) {
  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <div>
          <h3>Sintesis de resultados</h3>
          <p className="diag-panel-copy">Seleccione la estrategia con mayor puntuacion.</p>
        </div>
      </div>
      <div className="diag-bcg-table-wrap">
        <table className="diag-bcg-table formu-summary-table">
          <thead>
            <tr>
              <th>Relaciones</th>
              <th>Tipologia de estrategia</th>
              <th>Puntuacion</th>
              <th>Descripcion</th>
              <th>Seleccion</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => {
              const canSelect = maxScore > 0 && result.score === maxScore
              return (
                <tr className={payload.selectedStrategy === result.relation ? 'selected' : ''} key={result.relation}>
                  <th>{result.relation}</th>
                  <td><strong>{result.strategy}</strong></td>
                  <td className="diag-bcg-number">{result.score}</td>
                  <td>{result.description}</td>
                  <td>
                    <input
                      checked={payload.selectedStrategy === result.relation}
                      disabled={disabled || !canSelect}
                      name="selectedStrategy"
                      type="radio"
                      onChange={() => onSelect(result.relation)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CameEditor({
  disabled,
  identification,
  onChange,
  payload,
}: {
  disabled: boolean
  identification: StrategyIdentificationPayload
  onChange: (payload: CamePayload) => void
  payload: CamePayload
}) {
  function updateActions(key: CameKey, actions: CameActionPayload[]) {
    onChange({ ...payload, [key]: actions })
  }

  return (
    <section className="diag-panel wide formu-came-panel">
      <div className="diag-panel-head">
        <div>
          <h3>Matriz CAME</h3>
          <p className="diag-panel-copy">
            Defina acciones para corregir, afrontar, mantener y explotar los resultados del FODA.
          </p>
        </div>
      </div>
      <div className="formu-came-grid">
        {cameSections.map((section) => (
          <CameSectionTable
            actions={payload[section.key]}
            disabled={disabled}
            key={section.key}
            section={section}
            sourceItems={identification[section.sourceKey]}
            onChange={(actions) => updateActions(section.key, actions)}
          />
        ))}
      </div>
    </section>
  )
}

function CameSectionTable({
  actions,
  disabled,
  onChange,
  section,
  sourceItems,
}: {
  actions: CameActionPayload[]
  disabled: boolean
  onChange: (actions: CameActionPayload[]) => void
  section: typeof cameSections[number]
  sourceItems: SwotItemPayload[]
}) {
  const rows = fitCameActions(actions, sourceItems)

  function updateRow(index: number, patch: Partial<CameActionPayload>) {
    onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  return (
    <article className="formu-came-section">
      <div className="formu-came-section-head">
        <span>{section.code}</span>
        <div>
          <h4>{section.title}</h4>
          <p>{section.copy}</p>
        </div>
      </div>
      <div className="diag-bcg-table-wrap">
        <table className="diag-bcg-table formu-came-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{section.sourceTitle}</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${section.key}-${index}`}>
                <th>{index + 1}</th>
                <td>
                  <div className="formu-came-source-item">
                    <strong>{section.prefix}{index + 1}.</strong>
                    <span>{row.relatedItem}</span>
                  </div>
                </td>
                <td>
                  <textarea
                    disabled={disabled}
                    placeholder="Accion a ejecutar"
                    rows={2}
                    value={row.action}
                    onChange={(event) => updateRow(index, { action: event.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}

type StrategyResult = {
  description: string
  relation: StrategyRelation
  score: number
  strategy: string
}

function relationHelp(relation: StrategyRelation) {
  if (relation === 'FO') return 'Las fortalezas se usan para tomar ventaja en cada una de las oportunidades.'
  if (relation === 'AF') return 'Las fortalezas evaden el efecto negativo de las amenazas.'
  if (relation === 'OD') return 'Superamos las debilidades tomando ventaja de las oportunidades.'
  return 'Las debilidades intensifican notablemente el efecto negativo de las amenazas.'
}

function swotPayloadFromSummary(summary: SwotSummary): StrategyIdentificationPayload {
  return strategyIdentificationFromSwot({
    strengths: swotItems(summary.strengths),
    opportunities: swotItems(summary.opportunities),
    weaknesses: swotItems(summary.weaknesses),
    threats: swotItems(summary.threats),
  })
}

function swotItems(items: SwotItemSummary[]): SwotItemPayload[] {
  return arrayValue(items)
    .map((item) => ({ description: textValue(item.description).trim(), priority: priorityValue(item.priority) }))
    .filter((item) => item.description)
}

function strategyIdentificationFromSwot(swot: Pick<StrategyIdentificationPayload, 'strengths' | 'opportunities' | 'weaknesses' | 'threats'>): StrategyIdentificationPayload {
  return normalizeSelection({
    strengths: arrayValue(swot.strengths),
    opportunities: arrayValue(swot.opportunities),
    weaknesses: arrayValue(swot.weaknesses),
    threats: arrayValue(swot.threats),
    scores: emptyScores(),
    selectedStrategy: '',
  })
}

function strategyIdentificationFromContent(content: Record<string, unknown>, fallback: StrategyIdentificationPayload): StrategyIdentificationPayload {
  const source = recordValue(content.strategyIdentification)
  if (!source) return strategyIdentificationFromSwot(fallback)
  return normalizeSelection({
    strengths: swotItemsFromUnknown(source.strengths, fallback.strengths),
    opportunities: swotItemsFromUnknown(source.opportunities, fallback.opportunities),
    weaknesses: swotItemsFromUnknown(source.weaknesses, fallback.weaknesses),
    threats: swotItemsFromUnknown(source.threats, fallback.threats),
    scores: scoresFromUnknown(source.scores),
    selectedStrategy: relationValue(source.selectedStrategy),
  })
}

function cleanStrategyIdentification(payload: StrategyIdentificationPayload): StrategyIdentificationPayload {
  return normalizeSelection({
    strengths: cleanSwotItems(payload.strengths),
    opportunities: cleanSwotItems(payload.opportunities),
    weaknesses: cleanSwotItems(payload.weaknesses),
    threats: cleanSwotItems(payload.threats),
    scores: payload.scores,
    selectedStrategy: payload.selectedStrategy,
  })
}

function normalizeSelection(payload: StrategyIdentificationPayload): StrategyIdentificationPayload {
  const next = {
    ...payload,
    scores: {
      FO: fitMatrix(payload.scores.FO, payload.strengths.length, payload.opportunities.length),
      AF: fitMatrix(payload.scores.AF, payload.strengths.length, payload.threats.length),
      OD: fitMatrix(payload.scores.OD, payload.weaknesses.length, payload.opportunities.length),
      AD: fitMatrix(payload.scores.AD, payload.weaknesses.length, payload.threats.length),
    },
  }
  const results = strategyResults(next)
  const maxScore = Math.max(0, ...results.map((item) => item.score))
  const selected = results.find((item) => item.relation === next.selectedStrategy)
  if (maxScore <= 0) return { ...next, selectedStrategy: '' }
  if (selected && selected.score === maxScore) return next
  return { ...next, selectedStrategy: results.find((item) => item.score === maxScore)?.relation ?? '' }
}

function validateIdentification(payload: StrategyIdentificationPayload) {
  if (!hasCompleteSwot(payload)) {
    return 'La identificacion requiere fortalezas, oportunidades, debilidades y amenazas aprobadas en FODA.'
  }
  const results = strategyResults(payload)
  const maxScore = Math.max(0, ...results.map((item) => item.score))
  if (maxScore <= 0) {
    return 'Puntue al menos una relacion estrategica antes de enviar a revision.'
  }
  const selected = results.find((item) => item.relation === payload.selectedStrategy)
  if (!selected || selected.score !== maxScore) {
    return 'Seleccione la estrategia con mayor puntuacion.'
  }
  return ''
}

function hasCompleteSwot(payload: Pick<StrategyIdentificationPayload, 'strengths' | 'opportunities' | 'weaknesses' | 'threats'>) {
  return payload.strengths.length > 0
    && payload.opportunities.length > 0
    && payload.weaknesses.length > 0
    && payload.threats.length > 0
}

function formulationChangeRequestPayload(
  payload: StrategyIdentificationPayload,
  entries: PhaseChangeEntry[],
): CreatePhaseChangeRequestPayload {
  return {
    title: 'Aprobar identificacion de estrategias',
    description: 'Solicitud para aprobar el cruce FODA y la estrategia principal.',
    proposedContent: { strategyIdentification: payload },
    entries,
  }
}

function formulationEntries(current: StrategyIdentificationPayload, next: StrategyIdentificationPayload): PhaseChangeEntry[] {
  const previousValue = stringify(current)
  const proposedValue = stringify(next)
  return previousValue === proposedValue
    ? []
    : [{ fieldKey: 'strategyIdentification', previousValue, proposedValue }]
}

function cameChangeRequestPayload(
  identification: StrategyIdentificationPayload,
  came: CamePayload,
  entries: PhaseChangeEntry[],
): CreatePhaseChangeRequestPayload {
  return {
    title: 'Aprobar matriz CAME',
    description: 'Solicitud para cerrar formulacion con acciones CAME.',
    proposedContent: { strategyIdentification: identification, came },
    entries,
  }
}

function cameEntries(current: CamePayload, next: CamePayload): PhaseChangeEntry[] {
  const previousValue = stringify(current)
  const proposedValue = stringify(next)
  return previousValue === proposedValue
    ? []
    : [{ fieldKey: 'came', previousValue, proposedValue }]
}

function validateCame(payload: CamePayload) {
  for (const section of cameSections) {
    const actions = payload[section.key]
    if (actions.length === 0) {
      return `Registre al menos una accion para ${section.title.toLowerCase()}.`
    }
    if (actions.some((action) => !action.relatedItem.trim())) {
      return 'Cada accion CAME debe indicar la estrategia a implementar.'
    }
  }
  return ''
}

function cleanCame(payload: CamePayload): CamePayload {
  return {
    correctWeaknesses: cleanCameActions(payload.correctWeaknesses),
    faceThreats: cleanCameActions(payload.faceThreats),
    maintainStrengths: cleanCameActions(payload.maintainStrengths),
    exploitOpportunities: cleanCameActions(payload.exploitOpportunities),
  }
}

function cameFromContent(content: Record<string, unknown>, identification: StrategyIdentificationPayload): CamePayload {
  const source = recordValue(content.came)
  if (!source) return cameFromIdentification(identification)
  return normalizeCame({
    correctWeaknesses: cameActionsFromUnknown(source.correctWeaknesses),
    faceThreats: cameActionsFromUnknown(source.faceThreats),
    maintainStrengths: cameActionsFromUnknown(source.maintainStrengths),
    exploitOpportunities: cameActionsFromUnknown(source.exploitOpportunities),
  }, identification)
}

function cameFromIdentification(identification: StrategyIdentificationPayload): CamePayload {
  return normalizeCame(emptyCame(), identification)
}

function normalizeCame(payload: CamePayload, identification: StrategyIdentificationPayload): CamePayload {
  return {
    correctWeaknesses: fitCameActions(payload.correctWeaknesses, identification.weaknesses),
    faceThreats: fitCameActions(payload.faceThreats, identification.threats),
    maintainStrengths: fitCameActions(payload.maintainStrengths, identification.strengths),
    exploitOpportunities: fitCameActions(payload.exploitOpportunities, identification.opportunities),
  }
}

function emptyCame(): CamePayload {
  return {
    correctWeaknesses: [],
    faceThreats: [],
    maintainStrengths: [],
    exploitOpportunities: [],
  }
}

function fitCameActions(actions: CameActionPayload[], sourceItems: SwotItemPayload[]) {
  const values = arrayValue(actions)
  return sourceItems.map((item, index) => {
    const current = values.find((action) => normalizeTextKey(action.relatedItem) === normalizeTextKey(item.description))
      ?? values[index]
    return {
      relatedItem: item.description,
      action: textValue(current?.action),
    }
  })
}

function cameActionsFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        relatedItem: textValue(item.relatedItem).trim(),
        action: textValue(item.action),
      }))
    : []
}

function cleanCameActions(actions: CameActionPayload[]) {
  return arrayValue(actions)
    .map((action) => ({
      relatedItem: textValue(action.relatedItem).trim(),
      action: textValue(action.action).trim(),
    }))
    .filter((action) => action.action)
}

function cameActionsCount(payload: CamePayload) {
  return Object.values(cleanCame(payload)).reduce((total, actions) => total + actions.length, 0)
}

function strategyResults(payload: StrategyIdentificationPayload): StrategyResult[] {
  return relationConfig.map((item) => ({
    ...item,
    score: relationTotal(payload, item.relation),
  }))
}

function relationRows(relation: StrategyRelation, payload: StrategyIdentificationPayload) {
  return relation === 'FO' || relation === 'AF' ? payload.strengths : payload.weaknesses
}

function relationColumns(relation: StrategyRelation, payload: StrategyIdentificationPayload) {
  return relation === 'FO' || relation === 'OD' ? payload.opportunities : payload.threats
}

function relationTotal(payload: StrategyIdentificationPayload, relation: StrategyRelation) {
  return payload.scores[relation].reduce((total, row) => total + row.reduce((sum, score) => sum + score, 0), 0)
}

function rowTotal(payload: StrategyIdentificationPayload, relation: StrategyRelation, row: number) {
  return arrayValue(payload.scores[relation][row]).reduce((total, score) => total + score, 0)
}

function columnTotal(payload: StrategyIdentificationPayload, relation: StrategyRelation, column: number) {
  return payload.scores[relation].reduce((total, row) => total + scoreValue(row[column]), 0)
}

function scoreAt(payload: StrategyIdentificationPayload, relation: StrategyRelation, row: number, column: number) {
  return scoreValue(payload.scores[relation]?.[row]?.[column])
}

function fitMatrix(matrix: number[][] | undefined, rows: number, columns: number) {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => scoreValue(matrix?.[row]?.[column])),
  )
}

function cloneScores(scores: Record<StrategyRelation, number[][]>) {
  return {
    FO: scores.FO.map((row) => [...row]),
    AF: scores.AF.map((row) => [...row]),
    OD: scores.OD.map((row) => [...row]),
    AD: scores.AD.map((row) => [...row]),
  }
}

function emptyScores(): Record<StrategyRelation, number[][]> {
  return { FO: [], AF: [], OD: [], AD: [] }
}

function scoresFromUnknown(value: unknown): Record<StrategyRelation, number[][]> {
  const source = recordValue(value)
  if (!source) return emptyScores()
  return {
    FO: matrixFromUnknown(source.FO),
    AF: matrixFromUnknown(source.AF),
    OD: matrixFromUnknown(source.OD),
    AD: matrixFromUnknown(source.AD),
  }
}

function matrixFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value.map((row) => Array.isArray(row) ? row.map(scoreValue) : [])
    : []
}

function swotItemsFromUnknown(value: unknown, fallback: SwotItemPayload[]) {
  const items = Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        description: textValue(item.description).trim(),
        priority: priorityValue(item.priority),
      }))
      .filter((item) => item.description)
    : []
  return items.length > 0 ? items : fallback
}

function cleanSwotItems(items: SwotItemPayload[]) {
  return arrayValue(items)
    .map((item) => ({ description: textValue(item.description).trim(), priority: priorityValue(item.priority) }))
    .filter((item) => item.description)
}

function scoreValue(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(4, Math.round(score)))
}

function relationValue(value: unknown): StrategyRelation | '' {
  return value === 'FO' || value === 'AF' || value === 'AD' || value === 'OD' ? value : ''
}

function hasStrategyIdentificationContent(content: Record<string, unknown>) {
  return Boolean(recordValue(content.strategyIdentification))
}

function hasCameContent(content: Record<string, unknown>) {
  return Boolean(recordValue(content.came))
}

function priorityValue(value: unknown): DiagnosticPriority {
  return priorities.includes(value as DiagnosticPriority) ? value as DiagnosticPriority : 'MEDIA'
}

function stringify(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : '-'
}

function userNameById(group: PlanningGroupSummary | null, userId?: number | null) {
  if (!userId) return '-'
  const member = group?.members.find((item) => item.userId === userId)
  return member ? `${member.firstName} ${member.lastName}` : `Usuario #${userId}`
}

function FormulationMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="gplan-dashboard-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
