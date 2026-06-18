import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Download,
  FileText,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getGroup } from '../api/groupApi'
import {
  getGroupPlan,
  getGroupPlanBcg,
  getGroupPlanIdentity,
  getGroupPlanPest,
  getGroupPlanPorter,
  getGroupPlanSwot,
  getGroupPlanValueChain,
  listPhaseVersions,
} from '../api/planApi'
import { setActivePetiGroupId } from '../session'
import type {
  BcgSummary,
  CamePayload,
  DiagnosticPriority,
  IdentitySectionSummary,
  PestSummary,
  PetiPhase,
  PhaseVersionSummary,
  PlanningGroupSummary,
  PlanSummary,
  PorterSummary,
  StrategyIdentificationPayload,
  StrategyRelation,
  SwotItemPayload,
  SwotSummary,
  ValueChainSummary,
} from '../types'
import type { ReactNode } from 'react'
import './PlanReportPage.css'

const relationLabels: Record<StrategyRelation, string> = {
  FO: 'Estrategia ofensiva',
  AF: 'Estrategia defensiva',
  AD: 'Estrategia de supervivencia',
  OD: 'Estrategia de reorientacion',
}

type ReportState = {
  group: PlanningGroupSummary | null
  plan: PlanSummary | null
  identity: IdentitySectionSummary | null
  pest: PestSummary | null
  porter: PorterSummary | null
  valueChain: ValueChainSummary | null
  bcg: BcgSummary | null
  swot: SwotSummary | null
  versions: Record<PetiPhase, PhaseVersionSummary[]>
  warnings: string[]
}

type ConsolidationPayload = {
  conclusions: string
}

const emptyVersions: Record<PetiPhase, PhaseVersionSummary[]> = {
  IDENTITY: [],
  DIAGNOSTICS: [],
  FORMULATION: [],
  CONSOLIDATION: [],
}

export default function PlanReportPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const numericGroupId = Number(groupId)
  const [state, setState] = useState<ReportState>({
    group: null,
    plan: null,
    identity: null,
    pest: null,
    porter: null,
    valueChain: null,
    bcg: null,
    swot: null,
    versions: emptyVersions,
    warnings: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!numericGroupId) {
      navigate('/plan')
      return
    }

    setActivePetiGroupId(numericGroupId)
    setLoading(true)
    setError(null)
    const warnings: string[] = []

    const [
      groupResult,
      planResult,
      identityResult,
      pestResult,
      porterResult,
      valueChainResult,
      bcgResult,
      swotResult,
      identityVersions,
      diagnosticsVersions,
      formulationVersions,
      consolidationVersions,
    ] = await Promise.allSettled([
      getGroup(numericGroupId),
      getGroupPlan(numericGroupId),
      getGroupPlanIdentity(numericGroupId),
      getGroupPlanPest(numericGroupId),
      getGroupPlanPorter(numericGroupId),
      getGroupPlanValueChain(numericGroupId),
      getGroupPlanBcg(numericGroupId),
      getGroupPlanSwot(numericGroupId),
      listPhaseVersions(numericGroupId, 'IDENTITY'),
      listPhaseVersions(numericGroupId, 'DIAGNOSTICS'),
      listPhaseVersions(numericGroupId, 'FORMULATION'),
      listPhaseVersions(numericGroupId, 'CONSOLIDATION'),
    ])

    const group = valueOrNull(groupResult, 'grupo', warnings)
    const plan = valueOrNull(planResult, 'plan PETI', warnings)
    if (!group && !plan) {
      setError('No se pudo cargar el informe del grupo solicitado.')
    }

    setState({
      group,
      plan,
      identity: valueOrNull(identityResult, 'identidad estrategica', warnings),
      pest: valueOrNull(pestResult, 'PEST', warnings),
      porter: valueOrNull(porterResult, 'Porter', warnings),
      valueChain: valueOrNull(valueChainResult, 'cadena de valor', warnings),
      bcg: valueOrNull(bcgResult, 'BCG', warnings),
      swot: valueOrNull(swotResult, 'FODA', warnings),
      versions: {
        IDENTITY: valueOrNull(identityVersions, 'contenido aprobado de identidad', warnings) ?? [],
        DIAGNOSTICS: valueOrNull(diagnosticsVersions, 'contenido aprobado de diagnostico', warnings) ?? [],
        FORMULATION: valueOrNull(formulationVersions, 'contenido aprobado de formulacion', warnings) ?? [],
        CONSOLIDATION: valueOrNull(consolidationVersions, 'contenido aprobado de consolidacion', warnings) ?? [],
      },
      warnings,
    })
    setLoading(false)
  }, [navigate, numericGroupId])

  useEffect(() => {
    load()
  }, [load])

  const formulation = useMemo(() => formulationSnapshot(state.versions.FORMULATION), [state.versions.FORMULATION])
  const consolidation = useMemo(() => consolidationSnapshot(state.versions.CONSOLIDATION), [state.versions.CONSOLIDATION])

  return (
    <div className="report-page">
      <header className="page-header report-header">
        <div className="page-header-right report-actions">
          <Link className="btn btn-secondary" to={`/groups/${numericGroupId}/plan`}>
            <ArrowLeft size={16} />
            Volver
          </Link>
          <button className="btn btn-primary" type="button" disabled={loading || !state.plan} onClick={() => window.print()}>
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </header>

      {error && (
        <div className="alert" role="alert">
          <CircleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && <section className="report-card"><p className="report-muted">Cargando informe...</p></section>}

      {!loading && (
        <article className="report-document">
          {state.warnings.length > 0 && (
            <section className="report-card report-warning">
              <div className="report-section-title">
                <CircleAlert size={18} />
                <h2>Secciones pendientes o no disponibles</h2>
              </div>
              <ul className="report-list">
                {state.warnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
            </section>
          )}

          <IdentitySection plan={state.plan} identity={state.identity} />
          <DiagnosticsSection
            bcg={state.bcg}
            pest={state.pest}
            porter={state.porter}
            swot={state.swot}
            valueChain={state.valueChain}
          />
          <FormulationSection formulation={formulation} />

          <section className="report-card">
            <div className="report-section-title">
              <FileText size={18} />
              <h2>Consolidacion</h2>
            </div>
            {consolidation.conclusions
              ? <Info label="Conclusiones" value={consolidation.conclusions} wide />
              : <PendingBlock label="Resumen ejecutivo final pendiente. Este informe ya puede exportarse con la informacion disponible." />}
          </section>
        </article>
      )}
    </div>
  )
}

function IdentitySection({ identity, plan }: { identity: IdentitySectionSummary | null; plan: PlanSummary | null }) {
  const profile = plan?.profile
  return (
    <section className="report-card">
      <div className="report-section-title">
        <Network size={18} />
        <h2>Fase 1. Identidad estrategica</h2>
      </div>
      {!plan && <PendingBlock label="Identidad pendiente: no existe plan PETI activo." />}
      {plan && (
        <>
          <div className="report-info-grid">
            <Info label="Empresa" value={profile?.companyName} />
            <Info label="Rubro" value={profile?.businessLine} />
            <Info label="Descripcion" value={profile?.description} wide />
            <Info label="Mision" value={identity?.mission || profile?.mission} wide />
            <Info label="Vision" value={identity?.vision || profile?.vision} wide />
            <Info label="Valores" value={identity?.valuesText || profile?.valuesText} wide />
          </div>
          <ReportSubsection title="Objetivos estrategicos">
            {identity?.objectives.length || plan.objectives.length ? (
              (identity?.objectives.length ? identity.objectives : plan.objectives).map((objective, index) => (
                <article className="report-item" key={`${objective.generalObjective}-${index}`}>
                  <strong>{objective.generalObjective || `Objetivo ${index + 1}`}</strong>
                  {objective.specificObjectives.length > 0 && (
                    <ul className="report-list">
                      {objective.specificObjectives.map((specific, specificIndex) => (
                        <li key={`${specific}-${specificIndex}`}>{specific}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))
            ) : <PendingBlock label="Sin objetivos registrados." />}
          </ReportSubsection>
        </>
      )}
    </section>
  )
}

function DiagnosticsSection({
  bcg,
  pest,
  porter,
  swot,
  valueChain,
}: {
  bcg: BcgSummary | null
  pest: PestSummary | null
  porter: PorterSummary | null
  swot: SwotSummary | null
  valueChain: ValueChainSummary | null
}) {
  return (
    <section className="report-card">
      <div className="report-section-title">
        <BarChart3 size={18} />
        <h2>Fase 2. Diagnostico estrategico</h2>
      </div>

      <ReportSubsection title="Analisis externo - PEST">
        {pest ? (
          <>
            <div className="report-metrics">
              <ReportMetric label="Preguntas respondidas" value={`${pest.answeredQuestions}/25`} />
              <ReportMetric label="Estado" value={pest.complete ? 'Completo' : 'En progreso'} />
            </div>
            <ReportBarChart
              items={pest.factors.map((factor) => ({
                label: factor.label,
                max: factor.maxScore,
                text: `${factor.score}/${factor.maxScore}`,
                value: factor.score,
              }))}
            />
            <SimpleTable
              columns={['Factor', 'Puntaje', 'Lectura']}
              rows={pest.factors.map((factor) => [
                factor.label,
                `${factor.score}/${factor.maxScore}`,
                factor.notableImpact ? 'Impacto notable' : 'Impacto moderado',
              ])}
            />
            <FindingsList items={pest.findings} />
          </>
        ) : <PendingBlock label="PEST pendiente o sin datos." />}
      </ReportSubsection>

      <ReportSubsection title="Analisis externo - Cinco fuerzas de Porter">
        {porter ? (
          <>
            <div className="report-metrics">
              <ReportMetric label="Preguntas respondidas" value={`${porter.answeredQuestions}/25`} />
              <ReportMetric label="Estado" value={porter.complete ? 'Completo' : 'En progreso'} />
            </div>
            <p className="report-text">{porter.conclusion || 'Sin conclusion registrada.'}</p>
            <ReportBarChart
              items={porter.forces.map((force) => ({
                label: force.label,
                max: force.maxScore,
                text: `${force.score}/${force.maxScore}`,
                value: force.score,
              }))}
            />
            <SimpleTable
              columns={['Fuerza', 'Puntaje', 'Lectura']}
              rows={porter.forces.map((force) => [
                force.label,
                `${force.score}/${force.maxScore}`,
                force.highPressure ? 'Presion alta' : 'Presion controlada',
              ])}
            />
            <FindingsList items={porter.findings} />
          </>
        ) : <PendingBlock label="Porter pendiente o sin datos." />}
      </ReportSubsection>

      <ReportSubsection title="Analisis interno - Cadena de valor">
        {valueChain ? (
          <>
            <div className="report-metrics">
              <ReportMetric label="Preguntas respondidas" value={`${valueChain.answeredQuestions}/25`} />
              <ReportMetric label="Puntaje" value={`${valueChain.totalScore}/${valueChain.maxScore}`} />
            </div>
            <p className="report-text">{valueChain.conclusion || 'Sin conclusion registrada.'}</p>
            <ReportBarChart
              items={valueChain.dimensions.map((dimension) => ({
                label: dimension.label,
                max: dimension.maxScore,
                text: `${dimension.score}/${dimension.maxScore}`,
                value: dimension.score,
              }))}
            />
            <SimpleTable
              columns={['Dimension', 'Puntaje', 'Preguntas']}
              rows={valueChain.dimensions.map((dimension) => [
                dimension.label,
                `${dimension.score}/${dimension.maxScore}`,
                String(dimension.answeredQuestions),
              ])}
            />
            <FindingsList items={valueChain.findings} />
          </>
        ) : <PendingBlock label="Cadena de valor pendiente o sin datos." />}
      </ReportSubsection>

      <ReportSubsection title="Analisis interno - BCG">
        {bcg ? (
          <>
            <div className="report-metrics">
              <ReportMetric label="Productos" value={String(bcg.products.length)} />
              <ReportMetric label="Estrellas" value={String(bcg.stars)} />
              <ReportMetric label="Interrogantes" value={String(bcg.questionMarks)} />
              <ReportMetric label="Vacas" value={String(bcg.cashCows)} />
              <ReportMetric label="Perros" value={String(bcg.dogs)} />
            </div>
            <ReportBcgChart bcg={bcg} />
            <SimpleTable
              columns={['Producto', 'Ventas', 'TCM', 'PRM', 'Cuadrante', 'Decision']}
              rows={bcg.products.map((product) => [
                product.name,
                money(product.annualSales),
                String(round(product.marketGrowthRate)),
                String(round(product.relativeMarketShare)),
                product.quadrant,
                product.strategicDecisionLabel,
              ])}
            />
            <FindingsList items={bcg.findings} />
          </>
        ) : <PendingBlock label="BCG pendiente o sin datos." />}
      </ReportSubsection>

      <ReportSubsection title="Matriz FODA final">
        {swot ? (
          <>
            <ReportBarChart
              items={[
                { label: 'Fortalezas', value: swot.strengths.length, max: maxSwotCount(swot), text: String(swot.strengths.length) },
                { label: 'Oportunidades', value: swot.opportunities.length, max: maxSwotCount(swot), text: String(swot.opportunities.length) },
                { label: 'Debilidades', value: swot.weaknesses.length, max: maxSwotCount(swot), text: String(swot.weaknesses.length) },
                { label: 'Amenazas', value: swot.threats.length, max: maxSwotCount(swot), text: String(swot.threats.length) },
              ]}
            />
            <SwotBlock swot={swot} />
          </>
        ) : <PendingBlock label="FODA pendiente o sin datos." />}
      </ReportSubsection>
    </section>
  )
}

function FormulationSection({ formulation }: { formulation: FormulationSnapshot }) {
  const identification = formulation.identification
  return (
    <section className="report-card">
      <div className="report-section-title">
        <ShieldCheck size={18} />
        <h2>Fase 3. Formulacion estrategica</h2>
      </div>

      <ReportSubsection title="Identificacion de estrategias">
        {identification ? (
          <>
            <div className="report-metrics">
              <ReportMetric
                label="Estrategia seleccionada"
                value={identification.selectedStrategy
                  ? relationLabels[identification.selectedStrategy]
                  : 'Pendiente'}
              />
              <ReportMetric label="Relacion" value={identification.selectedStrategy || '-'} />
            </div>
            <SimpleTable
              columns={['Relacion', 'Tipologia', 'Puntaje']}
              rows={(['FO', 'AF', 'AD', 'OD'] as StrategyRelation[]).map((relation) => [
                relation,
                relationLabels[relation],
                String(relationTotal(identification, relation)),
              ])}
            />
          </>
        ) : <PendingBlock label="Identificacion de estrategias pendiente." />}
      </ReportSubsection>

      <ReportSubsection title="Matriz CAME">
        {formulation.came ? <CameBlock came={formulation.came} /> : <PendingBlock label="Matriz CAME pendiente." />}
      </ReportSubsection>
    </section>
  )
}

function SwotBlock({ swot }: { swot: SwotSummary }) {
  return (
    <div className="report-swot-grid">
      <SwotColumn title="Fortalezas" items={swot.strengths} />
      <SwotColumn title="Oportunidades" items={swot.opportunities} />
      <SwotColumn title="Debilidades" items={swot.weaknesses} />
      <SwotColumn title="Amenazas" items={swot.threats} />
    </div>
  )
}

function SwotColumn({ items, title }: { items: Array<{ description: string; priority: string }>; title: string }) {
  return (
    <div className="report-swot-column">
      <strong>{title}</strong>
      {items.length === 0 && <span className="report-muted">Sin registros.</span>}
      {items.map((item, index) => (
        <p key={`${item.description}-${index}`}>
          {item.description}
          <em>{item.priority}</em>
        </p>
      ))}
    </div>
  )
}

function CameBlock({ came }: { came: CamePayload }) {
  return (
    <div className="report-came-grid">
      <CameColumn title="Corregir debilidades" actions={came.correctWeaknesses} />
      <CameColumn title="Afrontar amenazas" actions={came.faceThreats} />
      <CameColumn title="Mantener fortalezas" actions={came.maintainStrengths} />
      <CameColumn title="Explotar oportunidades" actions={came.exploitOpportunities} />
    </div>
  )
}

function CameColumn({ actions, title }: { actions: Array<{ action: string; relatedItem: string }>; title: string }) {
  const cleanActions = actions.filter((action) => action.action)
  return (
    <div className="report-came-column">
      <strong>{title}</strong>
      {cleanActions.length === 0 && <span className="report-muted">Sin acciones.</span>}
      {cleanActions.map((action, index) => (
        <p key={`${action.relatedItem}-${index}`}>
          <span>{action.relatedItem}</span>
          {action.action}
        </p>
      ))}
    </div>
  )
}

function FindingsList({ items }: { items: Array<{ category: string; description: string; priority: string }> }) {
  if (items.length === 0) return <PendingBlock label="Sin hallazgos registrados." />
  return (
    <SimpleTable
      columns={['Categoria', 'Hallazgo', 'Prioridad']}
      rows={items.map((item) => [item.category, item.description, item.priority])}
    />
  )
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>Sin datos.</td>
            </tr>
          )}
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}>{cell || '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportSubsection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="report-subsection">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ReportBarChart({ items }: { items: Array<{ label: string; max: number; text: string; value: number }> }) {
  return (
    <div className="report-chart">
      {items.map((item) => {
        const width = item.max > 0 ? Math.max(2, Math.min(100, (item.value / item.max) * 100)) : 0
        return (
          <div className="report-chart-row" key={item.label}>
            <span>{item.label}</span>
            <svg aria-hidden="true" viewBox="0 0 100 8" preserveAspectRatio="none">
              <rect className="track" width="100" height="8" rx="4" />
              <rect className="fill" width={width} height="8" rx="4" />
            </svg>
            <strong>{item.text}</strong>
          </div>
        )
      })}
    </div>
  )
}

function ReportBcgChart({ bcg }: { bcg: BcgSummary }) {
  const thresholdGrowth = bcg.marketGrowthThreshold || 10
  const thresholdShare = bcg.relativeMarketShareThreshold || 1
  return (
    <div className="report-bcg-chart">
      <svg viewBox="0 0 100 100" role="img" aria-label="Grafico BCG">
        <rect className="quadrant q1" x="0" y="0" width="50" height="50" />
        <rect className="quadrant q2" x="50" y="0" width="50" height="50" />
        <rect className="quadrant q3" x="0" y="50" width="50" height="50" />
        <rect className="quadrant q4" x="50" y="50" width="50" height="50" />
        <line x1="50" y1="0" x2="50" y2="100" />
        <line x1="0" y1="50" x2="100" y2="50" />
        <text x="8" y="12">Incognita</text>
        <text x="65" y="12">Estrella</text>
        <text x="8" y="92">Perro</text>
        <text x="70" y="92">Vaca</text>
        {bcg.products.map((product, index) => {
          const x = chartCoordinate(product.relativeMarketShare, thresholdShare)
          const y = 100 - chartCoordinate(product.marketGrowthRate, thresholdGrowth)
          return (
            <g key={`${product.name}-${index}`}>
              <circle cx={x} cy={y} r="3.2" />
              <text className="point-label" x={Math.min(94, x + 4)} y={Math.max(6, y - 2)}>{product.name || `P${index + 1}`}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Info({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={`report-info ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <p>{value || '-'}</p>
    </div>
  )
}

function PendingBlock({ label }: { label: string }) {
  return (
    <div className="report-pending">
      <CheckCircle2 size={16} />
      <span>{label}</span>
    </div>
  )
}

function valueOrNull<T>(result: PromiseSettledResult<T>, label: string, warnings: string[]) {
  if (result.status === 'fulfilled') return result.value
  warnings.push(`No se pudo cargar ${label}. El informe continuara con las demas secciones.`)
  return null
}

function maxSwotCount(swot: SwotSummary) {
  return Math.max(1, swot.strengths.length, swot.opportunities.length, swot.weaknesses.length, swot.threats.length)
}

function consolidationSnapshot(versions: PhaseVersionSummary[]): ConsolidationPayload {
  const source = recordValue(versions[0]?.content.consolidation)
  return { conclusions: textValue(source?.conclusions) }
}

type FormulationSnapshot = {
  came: CamePayload | null
  identification: StrategyIdentificationPayload | null
}

function formulationSnapshot(versions: PhaseVersionSummary[]): FormulationSnapshot {
  const source = versions.find((version) => recordValue(version.content.strategyIdentification))?.content
  const identification = source ? strategyIdentificationFromUnknown(source.strategyIdentification) : null
  const cameSource = versions.find((version) => recordValue(version.content.came))?.content
  return {
    identification,
    came: cameSource ? cameFromUnknown(cameSource.came) : null,
  }
}

function strategyIdentificationFromUnknown(value: unknown): StrategyIdentificationPayload | null {
  const source = recordValue(value)
  if (!source) return null
  return {
    strengths: swotItemsFromUnknown(source.strengths),
    opportunities: swotItemsFromUnknown(source.opportunities),
    weaknesses: swotItemsFromUnknown(source.weaknesses),
    threats: swotItemsFromUnknown(source.threats),
    scores: {
      FO: matrixFromUnknown(recordValue(source.scores)?.FO),
      AF: matrixFromUnknown(recordValue(source.scores)?.AF),
      AD: matrixFromUnknown(recordValue(source.scores)?.AD),
      OD: matrixFromUnknown(recordValue(source.scores)?.OD),
    },
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

function swotItemsFromUnknown(value: unknown): SwotItemPayload[] {
  return Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({ description: textValue(item.description), priority: priorityValue(item.priority) }))
      .filter((item) => item.description)
    : []
}

function actionsFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({ relatedItem: textValue(item.relatedItem), action: textValue(item.action) }))
    : []
}

function matrixFromUnknown(value: unknown) {
  return Array.isArray(value)
    ? value.map((row) => Array.isArray(row) ? row.map((score) => Number(score) || 0) : [])
    : []
}

function relationTotal(payload: StrategyIdentificationPayload, relation: StrategyRelation) {
  return payload.scores[relation].reduce((total, row) => total + row.reduce((sum, score) => sum + score, 0), 0)
}

function relationValue(value: unknown): StrategyRelation | '' {
  return value === 'FO' || value === 'AF' || value === 'AD' || value === 'OD' ? value : ''
}

function priorityValue(value: unknown): DiagnosticPriority {
  return value === 'ALTA' || value === 'MEDIA' || value === 'BAJA' ? value : 'MEDIA'
}

function recordValue(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function chartCoordinate(value: number, threshold: number) {
  const safeThreshold = threshold > 0 ? threshold : 1
  if (value >= safeThreshold) return Math.min(94, 55 + ((value - safeThreshold) / safeThreshold) * 40)
  return Math.max(6, 6 + (value / safeThreshold) * 39)
}

function money(value: number) {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 }).format(value)
}

function round(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100
}
