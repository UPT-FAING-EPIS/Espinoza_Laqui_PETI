import {
  BarChart3,
  CheckCircle2,
  Database,
  FileText,
  GitPullRequest,
  Globe2,
  History,
  PencilLine,
  PieChart,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Workflow,
  XCircle,
} from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPhaseChangeRequest,
  getGroupPlanBcg,
  getGroupPlanPest,
  getGroupPlanPorter,
  getGroupPlanSwot,
  getGroupPlanValueChain,
  listPhaseChangeRequests,
  listPhaseVersions,
  submitPhaseChangeRequest,
  updatePhaseChangeRequest,
} from '../api/planApi'
import { useAuth } from '../context/AuthContext'
import type {
  BcgPortfolioItemPayload,
  BcgQuadrant,
  BcgSummary,
  CreatePhaseChangeRequestPayload,
  DiagnosticFindingPayload,
  DiagnosticPriority,
  PhaseChangeEntry,
  PhaseChangeRequestSummary,
  PhaseVersionSummary,
  PestSummary,
  PorterSummary,
  PlanningGroupSummary,
  PlanSummary,
  SwotItemPayload,
  SwotSummary,
  UpdateBcgPayload,
  UpdatePestPayload,
  UpdatePorterPayload,
  UpdateSwotPayload,
  UpdateValueChainPayload,
  ValueChainActivity,
  ValueChainActivityPayload,
  ValueChainAssessmentPayload,
  ValueChainDimension,
  ValueChainQuestionSummary,
  ValueChainSummary,
} from '../types'
import './DiagnosticsWorkspace.css'
import { PestEditor, pestFactorScores } from './PestEditor'
import { PorterEditor } from './PorterEditor'
import { porterForceScores, porterOverallPressure } from './porterMetrics'

type DiagnosticToolKey = 'pest' | 'porter' | 'valueChain' | 'bcg' | 'foda'
type DiagnosticAreaKey = 'external' | 'internal' | 'foda'
type SwotKey = keyof UpdateSwotPayload
type SwotSourceSuggestion = {
  key: SwotKey
  description: string
  priority: DiagnosticPriority
  source: string
  sourceDimension: string
}
type BcgDerivedProduct = BcgPortfolioItemPayload & {
  salesPercentage: number
  largestCompetitorSales: number
  quadrant: BcgQuadrant
  position: number
}
type DiagnosticPreviewPayload =
  | { tool: 'pest'; pest: UpdatePestPayload }
  | { tool: 'porter'; porter: UpdatePorterPayload }
  | { tool: 'foda'; swot: UpdateSwotPayload }
  | { tool: 'valueChain'; valueChain: UpdateValueChainPayload }
  | { tool: 'bcg'; bcg: UpdateBcgPayload }

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']

const diagnosticTools: Array<{
  key: DiagnosticToolKey
  icon: typeof ShieldCheck
  title: string
  subtitle: string
}> = [
  { key: 'pest', icon: Globe2, title: 'PEST', subtitle: 'Analisis externo global' },
  { key: 'porter', icon: ShieldCheck, title: 'Porter', subtitle: 'Microentorno sectorial' },
  { key: 'valueChain', icon: Workflow, title: 'Cadena de valor', subtitle: 'Diagnostico interno' },
  { key: 'bcg', icon: PieChart, title: 'BCG', subtitle: 'Cartera de productos' },
  { key: 'foda', icon: ShieldCheck, title: 'FODA', subtitle: 'Resultado consolidado' },
]

const diagnosticAreas: Array<{
  key: DiagnosticAreaKey
  defaultTool: DiagnosticToolKey
  icon: typeof ShieldCheck
  title: string
  subtitle: string
}> = [
  { key: 'external', defaultTool: 'pest', icon: Globe2, title: 'Analisis externo', subtitle: 'Macroentorno y sector' },
  { key: 'internal', defaultTool: 'valueChain', icon: Workflow, title: 'Analisis interno', subtitle: 'Capacidades y cartera' },
  { key: 'foda', defaultTool: 'foda', icon: ShieldCheck, title: 'Matriz FODA', subtitle: 'Resultado del diagnostico' },
]

const diagnosticAreaTools: Record<Exclude<DiagnosticAreaKey, 'foda'>, Array<{
  key: DiagnosticToolKey
  icon: typeof ShieldCheck
  title: string
  subtitle: string
}>> = {
  external: [
    { key: 'pest', icon: Globe2, title: 'PEST', subtitle: 'Macroentorno global' },
    { key: 'porter', icon: ShieldCheck, title: 'Cinco fuerzas de Porter', subtitle: 'Microentorno sectorial' },
  ],
  internal: [
    { key: 'valueChain', icon: Workflow, title: 'Cadena de valor', subtitle: 'Procesos y capacidades' },
    { key: 'bcg', icon: PieChart, title: 'Matriz BCG', subtitle: 'Cartera de productos' },
  ],
}

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

const valueChainScoreLabels = [
  'En total desacuerdo',
  'No esta de acuerdo',
  'Esta de acuerdo',
  'Esta bastante de acuerdo',
  'En total acuerdo',
]

const valueChainQuestionCatalog: ValueChainQuestionSummary[] = [
  {
    questionNumber: 1,
    activity: 'OPERACIONES',
    dimensions: ['ORGANIZATION_STRATEGY'],
    statement: 'La empresa tiene una politica sistematizada de cero defectos en la produccion de productos/servicios.',
    score: null,
  },
  {
    questionNumber: 2,
    activity: 'OPERACIONES',
    dimensions: ['CUSTOMER_DISTRIBUTION'],
    statement: 'La empresa emplea los medios productivos tecnologicamente mas avanzados de su sector.',
    score: null,
  },
  {
    questionNumber: 3,
    activity: 'INFRAESTRUCTURA_EMPRESARIAL',
    dimensions: ['ORGANIZATION_STRATEGY'],
    statement: 'La empresa dispone de un sistema de informacion y control de gestion eficiente y eficaz.',
    score: null,
  },
  {
    questionNumber: 4,
    activity: 'DESARROLLO_TECNOLOGICO',
    dimensions: ['TECHNOLOGY_IMPROVEMENT'],
    statement: 'Los medios tecnicos y tecnologicos de la empresa estan preparados para competir en un futuro a corto, medio y largo plazo.',
    score: null,
  },
  {
    questionNumber: 5,
    activity: 'DESARROLLO_TECNOLOGICO',
    dimensions: ['TECHNOLOGY_IMPROVEMENT'],
    statement: 'La empresa es un referente en su sector en I+D+i.',
    score: null,
  },
  {
    questionNumber: 6,
    activity: 'INFRAESTRUCTURA_EMPRESARIAL',
    dimensions: ['PROCESS_NORMALIZATION'],
    statement: 'La excelencia de los procedimientos de la empresa, por ejemplo ISO, es una principal fuente de ventaja competitiva.',
    score: null,
  },
  {
    questionNumber: 7,
    activity: 'MARKETING_VENTAS',
    dimensions: ['ORGANIZATION_STRATEGY'],
    statement: 'La empresa dispone de pagina web y la emplea no solo como escaparate virtual, sino tambien para establecer relaciones con clientes y proveedores.',
    score: null,
  },
  {
    questionNumber: 8,
    activity: 'DESARROLLO_TECNOLOGICO',
    dimensions: ['PRODUCT_PRODUCTIVITY'],
    statement: 'Los productos/servicios que desarrolla la empresa llevan incorporada una tecnologia dificil de imitar.',
    score: null,
  },
  {
    questionNumber: 9,
    activity: 'OPERACIONES',
    dimensions: ['PRODUCT_PRODUCTIVITY'],
    statement: 'La empresa es referente en su sector en la optimizacion, en terminos de coste, de su cadena de produccion.',
    score: null,
  },
  {
    questionNumber: 10,
    activity: 'DESARROLLO_TECNOLOGICO',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La informatizacion de la empresa es una fuente de ventaja competitiva clara respecto a sus competidores.',
    score: null,
  },
  {
    questionNumber: 11,
    activity: 'LOGISTICA_SALIDA',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'Los canales de distribucion de la empresa son una importante fuente de ventajas competitivas.',
    score: null,
  },
  {
    questionNumber: 12,
    activity: 'MARKETING_VENTAS',
    dimensions: ['PRODUCT_PRODUCTIVITY'],
    statement: 'Los productos/servicios de la empresa son altamente y diferencialmente valorados por el cliente respecto a los competidores.',
    score: null,
  },
  {
    questionNumber: 13,
    activity: 'MARKETING_VENTAS',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La empresa dispone y ejecuta un sistematico plan de marketing y ventas.',
    score: null,
  },
  {
    questionNumber: 14,
    activity: 'INFRAESTRUCTURA_EMPRESARIAL',
    dimensions: ['PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La empresa tiene optimizada su gestion financiera.',
    score: null,
  },
  {
    questionNumber: 15,
    activity: 'SERVICIOS',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La empresa busca continuamente mejorar la relacion con sus clientes reduciendo plazos, personalizando la oferta o mejorando las condiciones de entrega.',
    score: null,
  },
  {
    questionNumber: 16,
    activity: 'DESARROLLO_TECNOLOGICO',
    dimensions: ['PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY'],
    statement: 'La empresa es referente en su sector en el lanzamiento de innovadores productos y servicios de exito demostrado en el mercado.',
    score: null,
  },
  {
    questionNumber: 17,
    activity: 'GESTION_RECURSOS_HUMANOS',
    dimensions: ['TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY'],
    statement: 'Los recursos humanos son especialmente responsables del exito de la empresa y se consideran un activo estrategico.',
    score: null,
  },
  {
    questionNumber: 18,
    activity: 'GESTION_RECURSOS_HUMANOS',
    dimensions: ['TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY'],
    statement: 'Se tiene una plantilla altamente motivada, que conoce con claridad las metas, objetivos y estrategias de la organizacion.',
    score: null,
  },
  {
    questionNumber: 19,
    activity: 'INFRAESTRUCTURA_EMPRESARIAL',
    dimensions: ['TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY'],
    statement: 'La empresa siempre trabaja conforme a una estrategia y objetivos claros.',
    score: null,
  },
  {
    questionNumber: 20,
    activity: 'INFRAESTRUCTURA_EMPRESARIAL',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La gestion del circulante esta optimizada.',
    score: null,
  },
  {
    questionNumber: 21,
    activity: 'MARKETING_VENTAS',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'Se tiene definido claramente el posicionamiento estrategico de todos los productos de la empresa.',
    score: null,
  },
  {
    questionNumber: 22,
    activity: 'MARKETING_VENTAS',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY'],
    statement: 'Se dispone de una politica de marca basada en reputacion, relacion con el cliente y posicionamiento estrategico.',
    score: null,
  },
  {
    questionNumber: 23,
    activity: 'SERVICIOS',
    dimensions: ['ORGANIZATION_STRATEGY'],
    statement: 'La cartera de clientes de la empresa esta altamente fidelizada porque su principal proposito es deleitarlos dia a dia.',
    score: null,
  },
  {
    questionNumber: 24,
    activity: 'MARKETING_VENTAS',
    dimensions: ['PROCESS_NORMALIZATION', 'TECHNOLOGY_IMPROVEMENT', 'PRODUCT_PRODUCTIVITY', 'ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'La politica y equipo de ventas y marketing es una importante ventaja competitiva de la empresa respecto al sector.',
    score: null,
  },
  {
    questionNumber: 25,
    activity: 'SERVICIOS',
    dimensions: ['ORGANIZATION_STRATEGY', 'CUSTOMER_DISTRIBUTION'],
    statement: 'El servicio al cliente que presta la empresa es una de sus principales ventajas competitivas respecto a sus competidores.',
    score: null,
  },
]

const emptySwot: UpdateSwotPayload = {
  strengths: [{ description: '', priority: 'MEDIA' }],
  opportunities: [{ description: '', priority: 'MEDIA' }],
  weaknesses: [{ description: '', priority: 'MEDIA' }],
  threats: [{ description: '', priority: 'MEDIA' }],
}

const emptyValueChain: UpdateValueChainPayload = {
  supportActivities: [{ activity: 'DESARROLLO_TECNOLOGICO', description: '', priority: 'MEDIA' }],
  primaryActivities: [{ activity: 'OPERACIONES', description: '', priority: 'MEDIA' }],
  assessments: [],
  observations: '',
  strengths: [],
  weaknesses: [],
  findings: [],
}

const BCG_DEFAULT_GROWTH_PERIODS = 5
const BCG_DEFAULT_DEMAND_PERIODS = 6
const BCG_MAX_COMPETITORS = 9
const bcgFindingDimensions = ['BCG', 'ESTRELLA', 'INCOGNITA', 'VACA', 'PERRO'] as const
const bcgFindingDimensionLabels: Record<typeof bcgFindingDimensions[number], string> = {
  BCG: 'Matriz BCG',
  ESTRELLA: 'Estrella',
  INCOGNITA: 'Incognita',
  VACA: 'Vaca',
  PERRO: 'Perro',
}

function emptyBcgProduct(
  growthPeriods = BCG_DEFAULT_GROWTH_PERIODS,
  demandPeriods = BCG_DEFAULT_DEMAND_PERIODS,
): BcgPortfolioItemPayload {
  return {
    name: '',
    description: '',
    annualSales: 0,
    marketGrowthRate: 0,
    relativeMarketShare: 0,
    marketGrowthRates: Array.from({ length: Math.max(1, growthPeriods) }, () => 0),
    sectorDemandValues: Array.from({ length: Math.max(1, demandPeriods) }, () => 0),
    competitors: [],
    notes: '',
  }
}

const emptyBcg: UpdateBcgPayload = {
  products: [emptyBcgProduct()],
  marketGrowthThreshold: 10,
  relativeMarketShareThreshold: 1,
  observations: '',
  strengths: [],
  weaknesses: [],
  findings: [],
}

const emptyPest: UpdatePestPayload = {
  responses: [],
  findings: [],
}

const emptyPorter: UpdatePorterPayload = {
  responses: [],
  findings: [],
}

export function DiagnosticsWorkspace({
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
  const [activeTool, setActiveTool] = useState<DiagnosticToolKey>('pest')
  const [pest, setPest] = useState<UpdatePestPayload>(emptyPest)
  const [porter, setPorter] = useState<UpdatePorterPayload>(emptyPorter)
  const [swot, setSwot] = useState<UpdateSwotPayload>(emptySwot)
  const [valueChain, setValueChain] = useState<UpdateValueChainPayload>(emptyValueChain)
  const [bcg, setBcg] = useState<UpdateBcgPayload>(emptyBcg)
  const [swotSummary, setSwotSummary] = useState<SwotSummary | null>(null)
  const [valueChainSummary, setValueChainSummary] = useState<ValueChainSummary | null>(null)
  const [bcgSummary, setBcgSummary] = useState<BcgSummary | null>(null)
  const [pestSummary, setPestSummary] = useState<PestSummary | null>(null)
  const [porterSummary, setPorterSummary] = useState<PorterSummary | null>(null)
  const [changes, setChanges] = useState<PhaseChangeRequestSummary[]>([])
  const [versions, setVersions] = useState<PhaseVersionSummary[]>([])
  const [previewVersion, setPreviewVersion] = useState<PhaseVersionSummary | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workflowAction, setWorkflowAction] = useState<string | null>(null)

  const activeToolMeta = diagnosticTools.find((tool) => tool.key === activeTool) ?? diagnosticTools[0]
  const activeArea = diagnosticAreaForTool(activeTool)
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
  const swotSuggestions = useMemo(
    () => swotSuggestionsFromDiagnostics(pest, porter, valueChain, bcg),
    [bcg, pest, porter, valueChain],
  )
  const workflowBusy = workflowAction !== null

  const loadDiagnostics = useCallback(async () => {
    setLoading(true)
    onError(null)
    try {
      const [nextPest, nextPorter, nextSwot, nextValueChain, nextBcg, nextChanges, nextVersions] = await Promise.all([
        getGroupPlanPest(groupId),
        getGroupPlanPorter(groupId),
        getGroupPlanSwot(groupId),
        getGroupPlanValueChain(groupId),
        getGroupPlanBcg(groupId),
        listPhaseChangeRequests(groupId, 'DIAGNOSTICS'),
        listPhaseVersions(groupId, 'DIAGNOSTICS'),
      ])
      setPestSummary(nextPest)
      setPorterSummary(nextPorter)
      setSwotSummary(nextSwot)
      setValueChainSummary(nextValueChain)
      setBcgSummary(nextBcg)
      const nextPestPayload = pestPayloadFromSummary(nextPest)
      const nextPorterPayload = porterPayloadFromSummary(nextPorter)
      const nextSwotPayload = swotPayloadFromSummary(nextSwot)
      const nextValueChainPayload = valueChainPayloadFromSummary(nextValueChain)
      const nextBcgPayload = bcgPayloadFromSummary(nextBcg)
      const nextSwotSuggestions = swotSuggestionsFromDiagnostics(
        nextPestPayload,
        nextPorterPayload,
        nextValueChainPayload,
        nextBcgPayload,
      )
      setPest(nextPestPayload)
      setPorter(nextPorterPayload)
      setSwot(
        swotHasContent(nextSwotPayload)
          ? nextSwotPayload
          : editorSwotPayload(swotPayloadFromSuggestions(nextSwotSuggestions)),
      )
      setValueChain(nextValueChainPayload)
      setBcg(nextBcgPayload)
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
    const validation = validateActiveTool(activeTool, pest, porter, swot, valueChain, bcg)
    if (validation) {
      onError(validation)
      return
    }

    setWorkflowAction('submit-diagnostics')
    onError(null)
    onNotice(null)
    try {
      const payload = diagnosticChangeRequestPayload(
        activeTool,
        pest,
        porter,
        swot,
        valueChain,
        bcg,
        swotSummary,
        valueChainSummary,
        bcgSummary,
        pestSummary,
        porterSummary,
      )
      const request = activeDraft
        ? await updatePhaseChangeRequest(groupId, 'DIAGNOSTICS', activeDraft.id, payload)
        : await createPhaseChangeRequest(groupId, 'DIAGNOSTICS', payload)
      const submitted = await submitPhaseChangeRequest(groupId, 'DIAGNOSTICS', request.id)
      setChanges((current) => [
        submitted,
        ...current.filter((change) => change.id !== submitted.id && change.id !== request.id),
      ])
      onNotice(`${activeToolMeta.title} enviado a revision del lider.`)
    } catch (exception) {
      onError(exception instanceof Error ? exception.message : 'No se pudo enviar el diagnostico a revision.')
    } finally {
      setWorkflowAction(null)
    }
  }

  function openDiagnosticPreview(version: PhaseVersionSummary | null) {
    setPreviewVersion(version)
    setPreviewOpen(true)
  }

  function handleLoadDiagnosticContent(payload: DiagnosticPreviewPayload, sourceLabel: string) {
    setActiveTool(payload.tool)
    if (payload.tool === 'pest') {
      setPest(editorPestPayload(payload.pest))
    }
    if (payload.tool === 'porter') {
      setPorter(editorPorterPayload(payload.porter))
    }
    if (payload.tool === 'foda') {
      setSwot(editorSwotPayload(payload.swot))
    }
    if (payload.tool === 'valueChain') {
      setValueChain(editorValueChainPayload(payload.valueChain))
    }
    if (payload.tool === 'bcg') {
      setBcg(editorBcgPayload(payload.bcg))
    }
    setPreviewOpen(false)
    onError(null)
    onNotice(
      pendingRequest
        ? `Contenido de ${sourceLabel} cargado en el editor. Hay una solicitud pendiente antes de enviar nuevos cambios.`
        : `Contenido de ${sourceLabel} cargado en el editor. Envielo a revision cuando este listo.`,
    )
  }

  function handleImportSwotSuggestions() {
    if (swotSuggestions.length === 0) {
      onError('No hay hallazgos seleccionados en PEST, Porter, cadena de valor o BCG para importar al FODA.')
      return
    }
    setSwot(editorSwotPayload(mergeSwotWithSuggestions(swot, swotSuggestions)))
    onError(null)
    onNotice('Hallazgos seleccionados importados al FODA. Revise y ajuste los campos antes de enviarlos a revision.')
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
            <span className="diag-updated">Actualizado {formatDate(activeUpdatedAt(activeTool, pestSummary, porterSummary, swotSummary, valueChainSummary, bcgSummary))}</span>
          </div>
          <div className="diag-tabs" role="tablist" aria-label="Submodulos del diagnostico estrategico">
            {diagnosticAreas.map((area) => {
              const Icon = area.icon
              return (
                <button
                  aria-selected={activeArea === area.key}
                  className={`diag-tab ${activeArea === area.key ? 'active' : ''}`}
                  key={area.key}
                  role="tab"
                  type="button"
                  onClick={() => setActiveTool(area.defaultTool)}
                >
                  <Icon size={17} />
                  <span>
                    <strong>{area.title}</strong>
                    <small>{area.subtitle}</small>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="card-body diag-body">
            {activeArea !== 'foda' && (
              <div className="diag-subtabs" role="tablist" aria-label={`Herramientas de ${diagnosticAreas.find((area) => area.key === activeArea)?.title}`}>
                {diagnosticAreaTools[activeArea].map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      aria-selected={activeTool === tool.key}
                      className={`diag-subtab ${activeTool === tool.key ? 'active' : ''}`}
                      key={tool.key}
                      role="tab"
                      title={tool.title}
                      type="button"
                      onClick={() => setActiveTool(tool.key)}
                    >
                      <Icon size={16} />
                      <span>
                        <strong>{tool.title}</strong>
                        <small>{tool.subtitle}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            {loading && <p className="gplan-muted">Cargando diagnosticos...</p>}
            {!loading && activeTool === 'pest' && (
              <PestEditor summary={pestSummary} value={pest} onChange={setPest} />
            )}
            {!loading && activeTool === 'porter' && (
              <PorterEditor summary={porterSummary} value={porter} onChange={setPorter} />
            )}
            {!loading && activeTool === 'foda' && (
              <SwotEditor
                suggestions={swotSuggestions}
                swot={swot}
                onChange={setSwot}
                onImportSuggestions={handleImportSwotSuggestions}
              />
            )}
            {!loading && activeTool === 'valueChain' && (
              <ValueChainEditor summary={valueChainSummary} value={valueChain} onChange={setValueChain} />
            )}
            {!loading && activeTool === 'bcg' && (
              <BcgEditor summary={bcgSummary} value={bcg} onChange={setBcg} />
            )}
          </div>
        </section>

        <div className="form-actions">
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
            <DiagnosticMetric label="PEST" value={`${pestSummary?.answeredQuestions ?? 0}/25`} />
            <DiagnosticMetric label="Porter" value={`${porterSummary?.pressurePercentage ?? 0}%`} />
            <DiagnosticMetric label="FODA" value={String(swotCount(swotSummary))} />
            <DiagnosticMetric label="Cadena" value={`${valueChainSummary?.improvementPercentage ?? 0}%`} />
            <DiagnosticMetric label="BCG" value={String(arrayValue(bcgSummary?.products).length)} />
          </div>

          <div className="gplan-workflow-summary">
            <div className="gplan-workflow-title">
              <GitPullRequest size={16} />
              <span>Revision diagnostico</span>
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
              <p className="gplan-muted">Complete la herramienta activa y enviela a revision.</p>
            )}
          </div>

          <div className="gplan-history-block">
            <div className="gplan-workflow-title">
              <History size={16} />
              <span>Versiones de diagnostico</span>
            </div>
            <button className="gplan-overview-card" type="button" onClick={() => openDiagnosticPreview(null)}>
              <FileText size={16} />
              <span>
                <strong>Actual</strong>
                <small>
                  {activeToolMeta.title} actual - {formatDate(activeUpdatedAt(activeTool, pestSummary, porterSummary, swotSummary, valueChainSummary, bcgSummary))}
                </small>
              </span>
            </button>
            {versions.length === 0 && <p className="gplan-muted">Sin versiones aprobadas en diagnosticos.</p>}
            {versions.map((version) => {
              const tool = diagnosticToolFromContent(version.content)
              return (
                <button
                  className="gplan-overview-card"
                  key={version.id}
                  type="button"
                  onClick={() => openDiagnosticPreview(version)}
                >
                  <FileText size={16} />
                  <span>
                    <strong>v{version.versionNumber} - {diagnosticToolLabel(tool)}</strong>
                    <small>
                      {formatDate(version.approvedAt)} - {userNameById(group, version.createdByUserId)}
                    </small>
                  </span>
                </button>
              )
            })}
          </div>

        </div>
      </aside>
      {previewOpen && (
        <DiagnosticPreviewModal
          activeTool={activeTool}
          bcgSummary={bcgSummary}
          group={group}
          onClose={() => setPreviewOpen(false)}
          onLoadContent={handleLoadDiagnosticContent}
          selectedVersion={previewVersion}
          pestSummary={pestSummary}
          porterSummary={porterSummary}
          swotSummary={swotSummary}
          valueChainSummary={valueChainSummary}
        />
      )}
    </div>
  )
}

function DiagnosticPreviewModal({
  activeTool,
  bcgSummary,
  group,
  onClose,
  onLoadContent,
  pestSummary,
  porterSummary,
  selectedVersion,
  swotSummary,
  valueChainSummary,
}: {
  activeTool: DiagnosticToolKey
  bcgSummary: BcgSummary | null
  group: PlanningGroupSummary | null
  onClose: () => void
  onLoadContent: (payload: DiagnosticPreviewPayload, sourceLabel: string) => void
  pestSummary: PestSummary | null
  porterSummary: PorterSummary | null
  selectedVersion: PhaseVersionSummary | null
  swotSummary: SwotSummary | null
  valueChainSummary: ValueChainSummary | null
}) {
  const payload = selectedVersion
    ? diagnosticPayloadFromContent(selectedVersion.content, activeTool)
    : diagnosticPayloadFromCurrent(activeTool, pestSummary, porterSummary, swotSummary, valueChainSummary, bcgSummary)
  const title = diagnosticToolLabel(payload.tool)
  const createdBy = selectedVersion ? userNameById(group, selectedVersion.createdByUserId) : '-'
  const approvedBy = selectedVersion ? userNameById(group, selectedVersion.approvedByUserId) : '-'

  return (
    <div className="gplan-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="diagnostic-overview-title">
      <section className="gplan-preview-modal">
        <header className="gplan-preview-header">
          <div>
            <span className="gplan-preview-kicker">Mini dashboard</span>
            <h2 id="diagnostic-overview-title">Resumen de diagnostico</h2>
            <p>{group?.name ?? 'Plan del grupo'} - {title}</p>
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
                    ? `${title} v${selectedVersion.versionNumber}`
                    : `${title} actual`}
                </h3>
              </div>
              {selectedVersion && (
                <strong>
                  Propuso {createdBy} / aprobo {approvedBy}
                </strong>
              )}
            </div>
            <DiagnosticPreviewContent payload={payload} />
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

function DiagnosticPreviewContent({ payload }: { payload: DiagnosticPreviewPayload }) {
  if (payload.tool === 'pest') {
    const pest = cleanPest(payload.pest)
    const scores = pestFactorScores(pest)
    return (
      <div className="gplan-preview-sections">
        <section>
          <h3>Indicadores</h3>
          <DiagnosticPreviewItem label="Preguntas respondidas" value={`${pest.responses.length}/25`} />
          <DiagnosticPreviewItem label="Hallazgos" value={String(pest.findings.length)} />
        </section>
        <DiagnosticListSection
          title="Impacto por factor"
          items={Object.entries(scores).map(([factor, score]) => `${factor}: ${score.level.toFixed(2)} (${score.score}/20)`)}
        />
        <DiagnosticListSection
          title="Oportunidades"
          items={pest.findings.filter((finding) => finding.category === 'OPORTUNIDAD').map((finding) => finding.description)}
        />
        <DiagnosticListSection
          title="Amenazas"
          items={pest.findings.filter((finding) => finding.category === 'AMENAZA').map((finding) => finding.description)}
        />
      </div>
    )
  }

  if (payload.tool === 'porter') {
    const porter = cleanPorter(payload.porter)
    const scores = porterForceScores(porter)
    return (
      <div className="gplan-preview-sections">
        <section>
          <h3>Indicadores</h3>
          <DiagnosticPreviewItem label="Preguntas respondidas" value={`${porter.responses.length}/25`} />
          <DiagnosticPreviewItem label="Presion global" value={`${porterOverallPressure(porter)}%`} />
          <DiagnosticPreviewItem label="Hallazgos" value={String(porter.findings.length)} />
        </section>
        <DiagnosticListSection
          title="Presion por fuerza"
          items={Object.entries(scores).map(([force, score]) => `${force}: ${score.level.toFixed(2)} (${score.score}/20)`)}
        />
        <DiagnosticListSection
          title="Oportunidades"
          items={porter.findings.filter((finding) => finding.category === 'OPORTUNIDAD').map((finding) => finding.description)}
        />
        <DiagnosticListSection
          title="Amenazas"
          items={porter.findings.filter((finding) => finding.category === 'AMENAZA').map((finding) => finding.description)}
        />
      </div>
    )
  }

  if (payload.tool === 'foda') {
    const swot = cleanSwot(payload.swot)
    return (
      <div className="gplan-preview-sections">
        <DiagnosticListSection title="Fortalezas" items={swot.strengths.map((item) => `${item.description} (${item.priority})`)} />
        <DiagnosticListSection title="Oportunidades" items={swot.opportunities.map((item) => `${item.description} (${item.priority})`)} />
        <DiagnosticListSection title="Debilidades" items={swot.weaknesses.map((item) => `${item.description} (${item.priority})`)} />
        <DiagnosticListSection title="Amenazas" items={swot.threats.map((item) => `${item.description} (${item.priority})`)} />
      </div>
    )
  }

  if (payload.tool === 'valueChain') {
    const valueChain = cleanValueChain(payload.valueChain)
    const totalScore = valueChain.assessments.reduce((total, assessment) => total + clamp(assessment.score, 0, 4), 0)
    const maxScore = 100
    const score = Math.round((totalScore * 100) / maxScore)
    const improvement = Math.max(0, 100 - score)
    return (
      <div className="gplan-preview-sections">
        <section>
          <h3>Indicadores</h3>
          <DiagnosticPreviewItem label="Madurez" value={`${score}% (${totalScore}/${maxScore})`} />
          <DiagnosticPreviewItem label="Potencial de mejora" value={`${improvement}%`} />
          <DiagnosticPreviewItem label="Preguntas respondidas" value={`${valueChain.assessments.length}/25`} />
          <DiagnosticPreviewItem label="Hallazgos" value={String(valueChain.findings.length)} />
        </section>
        <DiagnosticListSection
          title="Actividades de apoyo"
          items={valueChain.supportActivities.map((item) => `${activityLabels[item.activity]}: ${item.description} (${item.priority})`)}
        />
        <DiagnosticListSection
          title="Actividades primarias"
          items={valueChain.primaryActivities.map((item) => `${activityLabels[item.activity]}: ${item.description} (${item.priority})`)}
        />
        <DiagnosticListSection
          title="Fortalezas"
          items={valueChain.findings.filter((finding) => finding.category === 'FORTALEZA').map((finding) => finding.description)}
        />
        <DiagnosticListSection
          title="Debilidades"
          items={valueChain.findings.filter((finding) => finding.category === 'DEBILIDAD').map((finding) => finding.description)}
        />
        <DiagnosticSynthesisSection
          observations={valueChain.observations}
          strengths={valueChain.findings.filter((finding) => finding.category === 'FORTALEZA').map((finding) => finding.description)}
          weaknesses={valueChain.findings.filter((finding) => finding.category === 'DEBILIDAD').map((finding) => finding.description)}
        />
      </div>
    )
  }

  const bcg = cleanBcg(payload.bcg)
  const bcgProducts = bcgDerivedProducts(bcg).filter((product) => product.name)
  const totalSales = bcgProducts.reduce((total, product) => total + product.annualSales, 0)
  const bcgFindings = arrayValue(bcg.findings)
  return (
    <div className="gplan-preview-sections">
      <section>
        <h3>Indicadores</h3>
        <DiagnosticPreviewItem label="Productos" value={String(bcgProducts.length)} />
        <DiagnosticPreviewItem label="Ventas" value={formatNumber(totalSales)} />
        <DiagnosticPreviewItem label="Crecimiento alto" value={`${bcg.marketGrowthThreshold}%`} />
        <DiagnosticPreviewItem label="Participacion alta" value={String(bcg.relativeMarketShareThreshold)} />
        <DiagnosticPreviewItem label="Hallazgos" value={String(bcgFindings.length)} />
      </section>
      <DiagnosticListSection
        title="Cartera"
        items={bcgProducts.map((product) => `${product.name}: ${bcgQuadrantLabel(product.quadrant)} - TCM ${formatNumber(product.marketGrowthRate)}%, PRM ${formatNumber(product.relativeMarketShare)}, ventas ${formatNumber(product.annualSales)}`)}
      />
      <DiagnosticListSection
        title="Fortalezas"
        items={bcgFindings.filter((finding) => finding.category === 'FORTALEZA').map((finding) => finding.description)}
      />
      <DiagnosticListSection
        title="Debilidades"
        items={bcgFindings.filter((finding) => finding.category === 'DEBILIDAD').map((finding) => finding.description)}
      />
      <DiagnosticSynthesisSection
        observations={bcg.observations}
        strengths={bcgFindings.filter((finding) => finding.category === 'FORTALEZA').map((finding) => finding.description)}
        weaknesses={bcgFindings.filter((finding) => finding.category === 'DEBILIDAD').map((finding) => finding.description)}
      />
    </div>
  )
}

function DiagnosticListSection({ items, title }: { items: string[]; title: string }) {
  return (
    <section className="gplan-preview-objectives">
      <h3>{title}</h3>
      {items.length === 0 && <p className="gplan-muted">Sin registros.</p>}
      {items.map((item, index) => (
        <article key={`${title}-${item}-${index}`}>
          <strong>{item}</strong>
        </article>
      ))}
    </section>
  )
}

function DiagnosticSynthesisSection({
  observations,
  strengths,
  weaknesses,
}: {
  observations: string
  strengths: string[]
  weaknesses: string[]
}) {
  return (
    <section>
      <h3>Sintesis</h3>
      <DiagnosticPreviewItem label="Observaciones" value={observations || '-'} multiline />
      <DiagnosticPreviewItem label="Fortalezas" value={strengths.length ? strengths.join('\n') : '-'} multiline />
      <DiagnosticPreviewItem label="Debilidades" value={weaknesses.length ? weaknesses.join('\n') : '-'} multiline />
    </section>
  )
}

function DiagnosticPreviewItem({
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

function SwotEditor({
  onChange,
  onImportSuggestions,
  suggestions,
  swot,
}: {
  onChange: (value: UpdateSwotPayload) => void
  onImportSuggestions: () => void
  suggestions: SwotSourceSuggestion[]
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
      <SwotSourceFindings suggestions={suggestions} onImport={onImportSuggestions} />
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
                    placeholder={`${section.title} ${index + 1}`}
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

function SwotSourceFindings({
  onImport,
  suggestions,
}: {
  onImport: () => void
  suggestions: SwotSourceSuggestion[]
}) {
  const sections: Array<{ key: SwotKey; title: string }> = [
    { key: 'strengths', title: 'Fortalezas' },
    { key: 'opportunities', title: 'Oportunidades' },
    { key: 'weaknesses', title: 'Debilidades' },
    { key: 'threats', title: 'Amenazas' },
  ]
  return (
    <section className="diag-panel wide diag-swot-source-panel">
      <div className="diag-panel-head">
        <div>
          <h3>Resultados seleccionados para FODA</h3>
          <p className="diag-panel-copy">
            Hallazgos marcados en PEST, Porter, cadena de valor y BCG. Puede importarlos como base y luego ajustarlos.
          </p>
        </div>
        <button className="gplan-inline-btn" disabled={suggestions.length === 0} type="button" onClick={onImport}>
          <Plus size={14} />
          Completar FODA
        </button>
      </div>
      {suggestions.length === 0 && (
        <p className="gplan-muted">No hay hallazgos seleccionados en los diagnosticos previos.</p>
      )}
      {suggestions.length > 0 && (
        <div className="diag-swot-source-grid">
          {sections.map((section) => {
            const items = suggestions.filter((suggestion) => suggestion.key === section.key)
            return (
              <article className="diag-swot-source-group" key={section.key}>
                <div className="diag-swot-source-head">
                  <strong>{section.title}</strong>
                  <span>{items.length}</span>
                </div>
                {items.length === 0 && <p className="gplan-muted">Sin hallazgos seleccionados.</p>}
                {items.map((item, index) => (
                  <div className="diag-swot-source-item" key={`${section.key}-${item.source}-${index}`}>
                    <div>
                      <strong>{item.description}</strong>
                      <span>{item.source}{item.sourceDimension ? ` / ${item.sourceDimension}` : ''}</span>
                    </div>
                    <em className={`diag-priority-pill ${item.priority.toLowerCase()}`}>{item.priority}</em>
                  </div>
                ))}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function ValueChainEditor({
  onChange,
  summary,
  value,
}: {
  onChange: (value: UpdateValueChainPayload) => void
  summary: ValueChainSummary | null
  value: UpdateValueChainPayload
}) {
  const current = valueChainFormValue(value)
  const questions = valueChainQuestions(summary, current)

  function updateActivity(
    listKey: 'supportActivities' | 'primaryActivities',
    index: number,
    patch: Partial<ValueChainActivityPayload>,
  ) {
    onChange({
      ...current,
      [listKey]: current[listKey].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  function addActivity(listKey: 'supportActivities' | 'primaryActivities') {
    const activity = listKey === 'supportActivities' ? 'DESARROLLO_TECNOLOGICO' : 'OPERACIONES'
    onChange({
      ...current,
      [listKey]: [...current[listKey], { activity, description: '', priority: 'MEDIA' }],
    })
  }

  function removeActivity(listKey: 'supportActivities' | 'primaryActivities', index: number) {
    const activity = listKey === 'supportActivities' ? 'DESARROLLO_TECNOLOGICO' : 'OPERACIONES'
    const next = current[listKey].filter((_, i) => i !== index)
    onChange({
      ...current,
      [listKey]: next.length > 0 ? next : [{ activity, description: '', priority: 'MEDIA' }],
    })
  }

  function updateResponse(question: ValueChainQuestionSummary, score: number) {
    const exists = current.assessments.some((assessment) => assessment.questionNumber === question.questionNumber)
    const nextAssessment: ValueChainAssessmentPayload = {
      questionNumber: question.questionNumber,
      activity: question.activity,
      statement: question.statement,
      score,
      notes: current.assessments.find((assessment) => assessment.questionNumber === question.questionNumber)?.notes ?? '',
    }
    onChange({
      ...current,
      assessments: exists
        ? current.assessments.map((assessment) =>
            assessment.questionNumber === question.questionNumber ? nextAssessment : assessment,
          )
        : [...current.assessments, nextAssessment].sort((a, b) => (a.questionNumber ?? 99) - (b.questionNumber ?? 99)),
    })
  }

  function updateObservation(observations: string) {
    onChange({ ...current, observations })
  }

  function addFinding(category: 'FORTALEZA' | 'DEBILIDAD') {
    onChange({ ...current, findings: [...current.findings, emptyValueChainFinding(category)] })
  }

  function updateFinding(index: number, patch: Partial<DiagnosticFindingPayload>) {
    onChange({
      ...current,
      findings: current.findings.map((finding, itemIndex) => itemIndex === index ? { ...finding, ...patch } : finding),
    })
  }

  function removeFinding(index: number) {
    onChange({
      ...current,
      findings: current.findings.filter((_, itemIndex) => itemIndex !== index),
    })
  }

  return (
    <div className="diag-chain-layout">
      <ValueChainChart summary={summary} value={current} />
      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Autodiagnostico interno</h3>
            <p className="diag-panel-copy">
              Responda las 25 afirmaciones del Excel. Una puntuacion mayor indica mayor madurez interna y menor potencial de mejora.
            </p>
          </div>
          <span className="diag-pest-progress">{valueChainAnsweredCount(current)}/25 respondidas</span>
        </div>
        <div className="diag-pest-questionnaire">
          {allActivities.map((activity) => {
            const activityQuestions = questions.filter((question) => question.activity === activity)
            if (activityQuestions.length === 0) return null
            return (
              <article className="diag-pest-factor" key={activity}>
                <header>
                  <strong>{activityLabels[activity]}</strong>
                  <span>{activityQuestions.filter((question) => valueChainResponseScore(current, question.questionNumber) !== null).length}/{activityQuestions.length}</span>
                </header>
                <div className="diag-pest-questions">
                  {activityQuestions.map((question) => {
                    const selected = valueChainResponseScore(current, question.questionNumber)
                    return (
                      <div className="diag-pest-question" key={question.questionNumber}>
                        <div className="diag-pest-question-copy">
                          <span>{question.questionNumber}</span>
                          <p>{question.statement}</p>
                        </div>
                        <div className="diag-pest-scale" role="group" aria-label={`Valoracion de pregunta ${question.questionNumber}`}>
                          {valueChainScoreLabels.map((label, score) => (
                            <button
                              aria-label={`${score}: ${label}`}
                              aria-pressed={selected === score}
                              className={selected === score ? 'active' : ''}
                              key={score}
                              title={label}
                              type="button"
                              onClick={() => updateResponse(question, score)}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      </section>
      <ActivityPanel
        activities={current.supportActivities}
        options={supportActivities}
        title="Actividades de apoyo"
        onAdd={() => addActivity('supportActivities')}
        onRemove={(index) => removeActivity('supportActivities', index)}
        onUpdate={(index, patch) => updateActivity('supportActivities', index, patch)}
      />
      <ActivityPanel
        activities={current.primaryActivities}
        options={primaryActivities}
        title="Actividades primarias"
        onAdd={() => addActivity('primaryActivities')}
        onRemove={(index) => removeActivity('primaryActivities', index)}
        onUpdate={(index, patch) => updateActivity('primaryActivities', index, patch)}
      />
      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Hallazgos del analisis interno</h3>
            <p className="diag-panel-copy">
              Registre todas las fortalezas y debilidades relevantes para llevarlas a la matriz FODA.
            </p>
          </div>
          <div className="diag-pest-finding-actions">
            <button className="gplan-inline-btn" type="button" onClick={() => addFinding('FORTALEZA')}>
              <Plus size={14} />
              Fortaleza
            </button>
            <button className="gplan-inline-btn" type="button" onClick={() => addFinding('DEBILIDAD')}>
              <Plus size={14} />
              Debilidad
            </button>
          </div>
        </div>
        <label className="field diag-chain-observation">
          <span className="field-label">Observaciones</span>
          <textarea
            rows={3}
            value={current.observations}
            onChange={(event) => updateObservation(event.target.value)}
            placeholder="Lectura general del potencial de mejora de la cadena"
          />
        </label>
        {current.findings.length === 0 && (
          <p className="gplan-muted">Todavia no se registraron fortalezas o debilidades de cadena de valor.</p>
        )}
        <div className="diag-pest-findings">
          {current.findings.map((finding, index) => (
            <article className="diag-pest-finding" key={index}>
              <div className="diag-pest-finding-head">
                <span className={`diag-pest-kind ${finding.category.toLowerCase()}`}>{finding.category}</span>
                <button className="gplan-remove-btn" title="Eliminar hallazgo" type="button" onClick={() => removeFinding(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="diag-pest-finding-grid">
                <label>
                  <span>Actividad de origen</span>
                  <select
                    value={finding.sourceDimension}
                    onChange={(event) => updateFinding(index, { sourceDimension: event.target.value as ValueChainActivity })}
                  >
                    {allActivities.map((activity) => (
                      <option key={activity} value={activity}>{activityLabels[activity]}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Prioridad</span>
                  <select
                    value={finding.priority}
                    onChange={(event) => updateFinding(index, { priority: event.target.value as DiagnosticPriority })}
                  >
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="wide">
                  <span>Descripcion</span>
                  <textarea
                    rows={2}
                    value={finding.description}
                    onChange={(event) => updateFinding(index, { description: event.target.value })}
                    placeholder="Explique la fortaleza o debilidad identificada"
                  />
                </label>
                <label>
                  <span>Evidencia</span>
                  <textarea
                    rows={2}
                    value={finding.evidence}
                    onChange={(event) => updateFinding(index, { evidence: event.target.value })}
                    placeholder="Dato o respuesta que sustenta el hallazgo"
                  />
                </label>
                <label>
                  <span>Impacto esperado</span>
                  <textarea
                    rows={2}
                    value={finding.impact}
                    onChange={(event) => updateFinding(index, { impact: event.target.value })}
                    placeholder="Como afecta a la organizacion"
                  />
                </label>
              </div>
              <label className="diag-pest-foda-check">
                <input
                  checked={finding.selectedForFoda}
                  type="checkbox"
                  onChange={(event) => updateFinding(index, { selectedForFoda: event.target.checked })}
                />
                <CheckCircle2 size={15} />
                Seleccionar para la matriz FODA
              </label>
            </article>
          ))}
        </div>
      </section>
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
  const current = bcgFormValue(value)
  const derivedProducts = bcgDerivedProducts(current)
  const resultCounts = bcgResultCounts(derivedProducts)
  const totalSales = derivedProducts.reduce((total, product) => total + product.annualSales, 0)
  const productNames = current.products.map((product, index) => product.name.trim() || `Producto ${index + 1}`)
  const growthPeriodCount = Math.max(
    1,
    ...current.products.map((product) => bcgPeriodList(product.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS).length),
  )
  const demandPeriodCount = Math.max(
    1,
    ...current.products.map((product) => bcgPeriodList(product.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true).length),
  )
  const competitorRowCount = Math.max(
    1,
    ...current.products.map((product) => arrayValue(product.competitors).length),
  )

  function updateProduct(index: number, patch: Partial<BcgPortfolioItemPayload>) {
    onChange({
      ...current,
      products: current.products.map((product, i) => (i === index ? { ...product, ...patch } : product)),
    })
  }

  function addProduct() {
    onChange({ ...current, products: [...current.products, emptyBcgProduct(growthPeriodCount, demandPeriodCount)] })
  }

  function removeProduct(index: number) {
    const next = current.products.filter((_, i) => i !== index)
    onChange({ ...current, products: next.length > 0 ? next : [emptyBcgProduct()] })
  }

  function updateGrowthRate(productIndex: number, periodIndex: number, value: number) {
    const rates = bcgPeriodList(current.products[productIndex]?.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS)
    while (rates.length <= periodIndex) {
      rates.push(0)
    }
    rates[periodIndex] = value
    updateProduct(productIndex, { marketGrowthRates: rates })
  }

  function addGrowthPeriod() {
    onChange({
      ...current,
      products: current.products.map((product) => ({
        ...product,
        marketGrowthRates: [...bcgPeriodList(product.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS), 0],
      })),
    })
  }

  function removeGrowthPeriod(periodIndex: number) {
    if (growthPeriodCount <= 1) return
    onChange({
      ...current,
      products: current.products.map((product) => {
        const rates = bcgPeriodList(product.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS)
        const nextRates = rates.filter((_, index) => index !== periodIndex)
        return { ...product, marketGrowthRates: nextRates.length > 0 ? nextRates : [0] }
      }),
    })
  }

  function updateSectorDemand(productIndex: number, periodIndex: number, value: number) {
    const values = bcgPeriodList(current.products[productIndex]?.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true)
    while (values.length <= periodIndex) {
      values.push(0)
    }
    values[periodIndex] = Math.max(0, value)
    updateProduct(productIndex, { sectorDemandValues: values })
  }

  function addSectorDemandPeriod() {
    onChange({
      ...current,
      products: current.products.map((product) => ({
        ...product,
        sectorDemandValues: [...bcgPeriodList(product.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true), 0],
      })),
    })
  }

  function removeSectorDemandPeriod(periodIndex: number) {
    if (demandPeriodCount <= 1) return
    onChange({
      ...current,
      products: current.products.map((product) => {
        const values = bcgPeriodList(product.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true)
        const nextValues = values.filter((_, index) => index !== periodIndex)
        return { ...product, sectorDemandValues: nextValues.length > 0 ? nextValues : [0] }
      }),
    })
  }

  function updateCompetitor(
    productIndex: number,
    competitorIndex: number,
    patch: Partial<BcgPortfolioItemPayload['competitors'][number]>,
  ) {
    const competitors = arrayValue(current.products[productIndex]?.competitors)
    while (competitors.length <= competitorIndex) {
      competitors.push({ name: '', sales: 0 })
    }
    competitors[competitorIndex] = { ...competitors[competitorIndex], ...patch }
    updateProduct(productIndex, { competitors: competitors.slice(0, BCG_MAX_COMPETITORS) })
  }

  function addCompetitor(productIndex: number) {
    const competitors = arrayValue(current.products[productIndex]?.competitors)
    if (competitors.length >= BCG_MAX_COMPETITORS) return
    updateProduct(productIndex, { competitors: [...competitors, { name: '', sales: 0 }] })
  }

  function removeCompetitor(productIndex: number, competitorIndex: number) {
    const competitors = arrayValue(current.products[productIndex]?.competitors)
    updateProduct(productIndex, { competitors: competitors.filter((_, index) => index !== competitorIndex) })
  }

  return (
    <div className="diag-bcg-layout">
      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Autodiagnostico BCG</h3>
            <p className="diag-panel-copy">Complete las tablas del formato para calcular TCM, PRM y participacion sobre ventas.</p>
          </div>
          <button
            className="gplan-inline-btn"
            type="button"
            onClick={addProduct}
          >
            <Plus size={14} />
            Producto
          </button>
        </div>
        <div className="diag-bcg-thresholds">
          <label>
            <span>Crecimiento alto desde</span>
            <input
              type="number"
              value={current.marketGrowthThreshold}
              onChange={(event) => onChange({ ...current, marketGrowthThreshold: numberValue(event.target.value) })}
            />
          </label>
          <label>
            <span>Participacion alta desde</span>
            <input
              min={0.01}
              step="0.01"
              type="number"
              value={current.relativeMarketShareThreshold}
              onChange={(event) => onChange({ ...current, relativeMarketShareThreshold: numberValue(event.target.value) })}
            />
          </label>
        </div>

        <div className="diag-bcg-table-stack">
          <div className="diag-bcg-table-block">
            <div className="diag-bcg-subhead">
              <strong>Prevision de ventas</strong>
              <span>Productos, ventas y porcentaje sobre total</span>
            </div>
            <div className="diag-bcg-table-wrap">
              <table className="diag-bcg-table product">
                <thead>
                  <tr>
                    <th>Productos</th>
                    <th>Ventas</th>
                    <th>% s/ total</th>
                    <th>Cuadrante</th>
                    <th>Descripcion</th>
                    <th>Notas estrategicas</th>
                    <th aria-label="Acciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {current.products.map((product, index) => {
                    const metrics = derivedProducts[index] ?? bcgDerivedProduct(product, current, index, totalSales)
                    return (
                      <tr key={`product-${index}`}>
                        <td>
                          <input
                            value={product.name}
                            onChange={(event) => updateProduct(index, { name: event.target.value })}
                            placeholder={`Producto ${index + 1}`}
                          />
                        </td>
                        <td>
                          <input
                            min={0}
                            type="number"
                            value={product.annualSales}
                            onChange={(event) => updateProduct(index, { annualSales: numberValue(event.target.value) })}
                            placeholder="Ventas"
                          />
                        </td>
                        <td className="diag-bcg-number">{formatNumber(metrics.salesPercentage)}%</td>
                        <td>
                          <span className={`diag-bcg-pill ${metrics.quadrant.toLowerCase()}`}>
                            {bcgQuadrantLabel(metrics.quadrant)}
                          </span>
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            value={product.description}
                            onChange={(event) => updateProduct(index, { description: event.target.value })}
                            placeholder="Descripcion"
                          />
                        </td>
                        <td>
                          <textarea
                            rows={2}
                            value={product.notes}
                            onChange={(event) => updateProduct(index, { notes: event.target.value })}
                            placeholder="Notas"
                          />
                        </td>
                        <td>
                          <button className="gplan-remove-btn" title="Eliminar producto" type="button" onClick={() => removeProduct(index)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="diag-bcg-total-row">
                    <th>Total</th>
                    <td className="diag-bcg-number">{formatNumber(totalSales)}</td>
                    <td className="diag-bcg-number">{formatNumber(totalSales > 0 ? 100 : 0)}%</td>
                    <td colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="diag-bcg-table-block">
            <div className="diag-bcg-subhead">
              <strong>Tasas de crecimiento del mercado (TCM)</strong>
              <div className="diag-bcg-subtools">
                <span>{growthPeriodCount} periodos</span>
                <button className="gplan-inline-btn" type="button" onClick={addGrowthPeriod}>
                  <Plus size={14} />
                  Periodo
                </button>
              </div>
            </div>
            <div className="diag-bcg-table-wrap">
              <table className="diag-bcg-table">
                <thead>
                  <tr>
                    <th>Periodos</th>
                    {productNames.map((name, index) => <th key={`growth-head-${index}`}>{name}</th>)}
                    <th aria-label="Acciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: growthPeriodCount }, (_, periodIndex) => (
                    <tr key={`growth-period-${periodIndex}`}>
                      <th>TCM {periodIndex + 1}</th>
                      {current.products.map((product, productIndex) => {
                        const rates = bcgPeriodList(product.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS)
                        return (
                          <td key={`growth-${productIndex}-${periodIndex}`}>
                            <input
                              type="number"
                              value={rates[periodIndex] ?? 0}
                              onChange={(event) => updateGrowthRate(productIndex, periodIndex, numberValue(event.target.value))}
                            />
                          </td>
                        )
                      })}
                      <td>
                        <button
                          className="gplan-remove-btn"
                          disabled={growthPeriodCount <= 1}
                          title="Quitar periodo"
                          type="button"
                          onClick={() => removeGrowthPeriod(periodIndex)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="diag-bcg-table-block">
            <div className="diag-bcg-subhead">
              <strong>BCG</strong>
              <span>Resultado calculado por producto</span>
            </div>
            <div className="diag-bcg-table-wrap">
              <table className="diag-bcg-table summary">
                <thead>
                  <tr>
                    <th>BCG</th>
                    {productNames.map((name, index) => <th key={`bcg-head-${index}`}>{name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>TCM</th>
                    {derivedProducts.map((product) => <td className="diag-bcg-number" key={`tcm-${product.position}`}>{formatNumber(product.marketGrowthRate)}%</td>)}
                  </tr>
                  <tr>
                    <th>PRM</th>
                    {derivedProducts.map((product) => <td className="diag-bcg-number" key={`prm-${product.position}`}>{formatNumber(product.relativeMarketShare)}</td>)}
                  </tr>
                  <tr>
                    <th>% s/ vtas</th>
                    {derivedProducts.map((product) => <td className="diag-bcg-number" key={`sales-${product.position}`}>{formatNumber(product.salesPercentage)}%</td>)}
                  </tr>
                  <tr>
                    <th>Decision</th>
                    {derivedProducts.map((product) => <td key={`decision-${product.position}`}>{bcgDecisionLabel(product.quadrant)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="diag-bcg-table-block">
            <div className="diag-bcg-subhead">
              <strong>Evolucion de la demanda global sector</strong>
              <div className="diag-bcg-subtools">
                <span>{demandPeriodCount} periodos</span>
                <button className="gplan-inline-btn" type="button" onClick={addSectorDemandPeriod}>
                  <Plus size={14} />
                  Periodo
                </button>
              </div>
            </div>
            <div className="diag-bcg-table-wrap">
              <table className="diag-bcg-table">
                <thead>
                  <tr>
                    <th>Anios</th>
                    {productNames.map((name, index) => <th key={`demand-head-${index}`}>{name}</th>)}
                    <th aria-label="Acciones"></th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: demandPeriodCount }, (_, periodIndex) => (
                    <tr key={`demand-period-${periodIndex}`}>
                      <th>Periodo {periodIndex + 1}</th>
                      {current.products.map((product, productIndex) => {
                        const values = bcgPeriodList(product.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true)
                        return (
                          <td key={`demand-${productIndex}-${periodIndex}`}>
                            <input
                              min={0}
                              type="number"
                              value={values[periodIndex] ?? 0}
                              onChange={(event) => updateSectorDemand(productIndex, periodIndex, numberValue(event.target.value))}
                            />
                          </td>
                        )
                      })}
                      <td>
                        <button
                          className="gplan-remove-btn"
                          disabled={demandPeriodCount <= 1}
                          title="Quitar periodo"
                          type="button"
                          onClick={() => removeSectorDemandPeriod(periodIndex)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="diag-bcg-table-block">
            <div className="diag-bcg-subhead">
              <strong>Niveles de venta de los competidores de cada producto</strong>
              <span>Hasta {BCG_MAX_COMPETITORS} competidores por producto</span>
            </div>
            <div className="diag-bcg-table-wrap">
              <table className="diag-bcg-table competitors">
                <thead>
                  <tr>
                    {productNames.map((name, productIndex) => (
                      <th colSpan={3} key={`competitor-group-${productIndex}`}>
                        <div className="diag-bcg-product-group">
                          <span>{name}</span>
                          <button
                            className="gplan-inline-btn"
                            disabled={arrayValue(current.products[productIndex]?.competitors).length >= BCG_MAX_COMPETITORS}
                            type="button"
                            onClick={() => addCompetitor(productIndex)}
                          >
                            <Plus size={14} />
                            Competidor
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {current.products.map((_, productIndex) => (
                      <Fragment key={`competitor-subhead-${productIndex}`}>
                        <th>Competidor</th>
                        <th>Ventas</th>
                        <th aria-label="Acciones"></th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: competitorRowCount }, (_, competitorIndex) => (
                    <tr key={`competitor-row-${competitorIndex}`}>
                      {current.products.map((product, productIndex) => {
                        const competitors = arrayValue(product.competitors)
                        const competitor = competitors[competitorIndex] ?? { name: '', sales: 0 }
                        const hasCompetitor = competitorIndex < competitors.length
                        return (
                          <Fragment key={`competitor-${productIndex}-${competitorIndex}`}>
                            <td>
                              <input
                                value={competitor.name}
                                onChange={(event) => updateCompetitor(productIndex, competitorIndex, { name: event.target.value })}
                                placeholder={`CP${productIndex + 1}-${competitorIndex + 1}`}
                              />
                            </td>
                            <td>
                              <input
                                min={0}
                                type="number"
                                value={competitor.sales}
                                onChange={(event) => updateCompetitor(productIndex, competitorIndex, { sales: numberValue(event.target.value) })}
                                placeholder="Ventas"
                              />
                            </td>
                            <td>
                              {hasCompetitor && (
                                <button
                                  className="gplan-remove-btn"
                                  title="Eliminar competidor"
                                  type="button"
                                  onClick={() => removeCompetitor(productIndex, competitorIndex)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </Fragment>
                        )
                      })}
                    </tr>
                  ))}
                  <tr className="diag-bcg-total-row">
                    {current.products.map((_, productIndex) => (
                      <Fragment key={`competitor-largest-${productIndex}`}>
                        <th>Mayor</th>
                        <td className="diag-bcg-number">{formatNumber(derivedProducts[productIndex]?.largestCompetitorSales ?? 0)}</td>
                        <td></td>
                      </Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <h3>Resultado BCG</h3>
          <span className="diag-total">Ventas {formatNumber(totalSales || summary?.totalSales || 0)}</span>
        </div>
        <BcgMatrix value={current} />
        <div className="diag-bcg-result">
          <DiagnosticMetric label="Estrellas" value={String(resultCounts.stars)} />
          <DiagnosticMetric label="Incognitas" value={String(resultCounts.questionMarks)} />
          <DiagnosticMetric label="Vacas" value={String(resultCounts.cashCows)} />
          <DiagnosticMetric label="Perros" value={String(resultCounts.dogs)} />
        </div>
        <div className="diag-version-list">
          {derivedProducts.filter((product) => product.name).map((product) => (
            <div className="diag-version-row" key={`${product.name}-${product.position}`}>
              <span>{product.name}</span>
              <strong>{bcgQuadrantLabel(product.quadrant)} / {formatNumber(product.salesPercentage)}%</strong>
            </div>
          ))}
        </div>
      </section>

      <BcgFindingsEditor value={current} onChange={onChange} />
    </div>
  )
}

function SwotChart({ swot }: { swot: UpdateSwotPayload }) {
  const sections: Array<{
    axis: 'Interno' | 'Externo'
    key: SwotKey
    label: string
    shortLabel: string
    tone: string
  }> = [
    { key: 'strengths', label: 'Fortalezas', shortLabel: 'F', axis: 'Interno', tone: 'strengths' },
    { key: 'weaknesses', label: 'Debilidades', shortLabel: 'D', axis: 'Interno', tone: 'weaknesses' },
    { key: 'opportunities', label: 'Oportunidades', shortLabel: 'O', axis: 'Externo', tone: 'opportunities' },
    { key: 'threats', label: 'Amenazas', shortLabel: 'A', axis: 'Externo', tone: 'threats' },
  ]
  const counts = sections.map((section) => ({
    ...section,
    items: cleanSwotItems(swot[section.key]),
  }))
    .map((section) => ({
      ...section,
      priorityCounts: priorities.map((priority) => ({
        priority,
        value: section.items.filter((item) => item.priority === priority).length,
      })),
      score: section.items.reduce((total, item) => total + swotPriorityWeight(item.priority), 0),
      value: section.items.length,
    }))
  const maxScore = Math.max(1, ...counts.map((item) => item.score))
  const allItems = sections.flatMap((section) => cleanSwotItems(swot[section.key]))
  const priorityCounts = priorities.map((priority) => ({
    priority,
    value: allItems.filter((item) => item.priority === priority).length,
  }))
  const favorableScore = swotWeightedScore(swot.strengths) + swotWeightedScore(swot.opportunities)
  const riskScore = swotWeightedScore(swot.weaknesses) + swotWeightedScore(swot.threats)
  const internalScore = swotWeightedScore(swot.strengths) + swotWeightedScore(swot.weaknesses)
  const externalScore = swotWeightedScore(swot.opportunities) + swotWeightedScore(swot.threats)
  const balance = favorableScore - riskScore
  const dominant = counts.reduce((current, item) => item.score > current.score ? item : current, counts[0])

  return (
    <section className="diag-chart-card wide">
      <div className="diag-chart-head">
        <div>
          <span>Grafico FODA</span>
          <h3>Mapa estrategico por cuadrante</h3>
        </div>
        <strong>{allItems.length} items / peso {favorableScore + riskScore}</strong>
      </div>

      <div className="diag-swot-map">
        <div className="diag-swot-axis corner"></div>
        <div className="diag-swot-axis favorable">Favorable</div>
        <div className="diag-swot-axis unfavorable">Desfavorable</div>
        <div className="diag-swot-axis side">Interno</div>
        <SwotQuadrantCard item={counts[0]} maxScore={maxScore} />
        <SwotQuadrantCard item={counts[1]} maxScore={maxScore} />
        <div className="diag-swot-axis side">Externo</div>
        <SwotQuadrantCard item={counts[2]} maxScore={maxScore} />
        <SwotQuadrantCard item={counts[3]} maxScore={maxScore} />
      </div>

      <div className="diag-swot-balance">
        <div>
          <span>Balance</span>
          <strong className={balance >= 0 ? 'positive' : 'negative'}>{balance >= 0 ? '+' : ''}{balance}</strong>
        </div>
        <div>
          <span>Interno</span>
          <strong>{internalScore}</strong>
        </div>
        <div>
          <span>Externo</span>
          <strong>{externalScore}</strong>
        </div>
        <div>
          <span>Mayor peso</span>
          <strong>{dominant.label}</strong>
        </div>
      </div>
      <div className="diag-priority-strip">
        {priorityCounts.map((item) => (
          <span className={`diag-priority-pill ${item.priority.toLowerCase()}`} key={item.priority}>
            {item.priority} - {item.value}
          </span>
        ))}
      </div>
    </section>
  )
}

function SwotQuadrantCard({
  item,
  maxScore,
}: {
  item: {
    axis: 'Interno' | 'Externo'
    key: SwotKey
    label: string
    priorityCounts: Array<{ priority: DiagnosticPriority; value: number }>
    score: number
    shortLabel: string
    tone: string
    value: number
  }
  maxScore: number
}) {
  const arc = Math.round((item.score / maxScore) * 100)
  return (
    <article className={`diag-swot-quadrant ${item.tone}`}>
      <div className="diag-swot-quadrant-head">
        <span>{item.shortLabel}</span>
        <div>
          <strong>{item.label}</strong>
          <small>{item.axis} / {item.value} items</small>
        </div>
      </div>
      <div className="diag-swot-quadrant-body">
        <div className="diag-swot-dial" style={{ background: `conic-gradient(currentColor ${arc}%, var(--surface-3) 0)` }}>
          <div>
            <strong>{item.score}</strong>
            <span>peso</span>
          </div>
        </div>
        <div className="diag-swot-priority-bars">
          {item.priorityCounts.map((priority) => (
            <div className="diag-swot-priority-row" key={`${item.key}-${priority.priority}`}>
              <span>{priority.priority}</span>
              <div className="diag-bar-track">
                <div
                  className={`diag-bar-fill ${priority.priority.toLowerCase()}`}
                  style={{ width: `${(priority.value / Math.max(1, item.value)) * 100}%` }}
                />
              </div>
              <strong>{priority.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function swotPriorityWeight(priority: DiagnosticPriority) {
  if (priority === 'ALTA') return 3
  if (priority === 'MEDIA') return 2
  return 1
}

function swotWeightedScore(items: SwotItemPayload[]) {
  return cleanSwotItems(items).reduce((total, item) => total + swotPriorityWeight(item.priority), 0)
}

function ValueChainChart({
  summary,
  value,
}: {
  summary: ValueChainSummary | null
  value: UpdateValueChainPayload
}) {
  const current = valueChainFormValue(value)
  const questions = valueChainQuestions(summary, current)
  const dimensions = valueChainDimensionScores(current, questions, arrayValue(summary?.dimensions))
  const answered = valueChainAnsweredCount(value)
  const totalScore = current.assessments.reduce((total, assessment) => total + clamp(assessment.score, 0, 4), 0)
  const maxScore = 100
  const maturity = Math.round((totalScore * 100) / maxScore)
  const improvement = Math.max(0, 100 - maturity)

  return (
    <section className="diag-chart-card wide">
      <div className="diag-chart-head">
        <div>
          <span>Grafico cadena de valor</span>
          <h3>Potencial de mejora interno</h3>
        </div>
        <strong>{answered === 25 ? `${improvement}% mejora` : `${answered}/25 respondidas`}</strong>
      </div>
      <div className="diag-score-visual">
        <div className="diag-score-ring" style={{ background: `conic-gradient(var(--amber) ${improvement}%, var(--surface-3) 0)` }}>
          <div>
            <strong>{improvement}%</strong>
            <span>mejora</span>
          </div>
        </div>
        <div className="diag-score-bars">
          <p className="diag-panel-copy">{summary?.conclusion ?? 'Complete las 25 preguntas para obtener el potencial de mejora interno.'}</p>
          {dimensions.map((item) => (
            <div className="diag-score-bar-row" key={item.dimension}>
              <span>{item.code} - {item.label}</span>
              <div className="diag-bar-track">
                <div className="diag-bar-fill amber" style={{ width: `${item.improvementPercentage}%` }} />
              </div>
              <strong>{item.improvementPercentage}%</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const valueChainDimensionLabels: Record<ValueChainDimension, { code: string; label: string }> = {
  CUSTOMER_DISTRIBUTION: { code: 'ICD', label: 'Cliente y distribucion' },
  ORGANIZATION_STRATEGY: { code: 'IOE', label: 'Organizacion y estrategia' },
  PROCESS_NORMALIZATION: { code: 'IPTN', label: 'Procesos y normalizacion' },
  PRODUCT_PRODUCTIVITY: { code: 'IPP', label: 'Producto y productividad' },
  TECHNOLOGY_IMPROVEMENT: { code: 'ITPM', label: 'Tecnologia y mejora' },
}

function valueChainFormValue(value: UpdateValueChainPayload): UpdateValueChainPayload {
  const source = value ?? emptyValueChain
  const support = arrayValue(source.supportActivities)
  const primary = arrayValue(source.primaryActivities)
  return {
    supportActivities: support.length > 0
      ? support
      : [{ activity: 'DESARROLLO_TECNOLOGICO', description: '', priority: 'MEDIA' }],
    primaryActivities: primary.length > 0
      ? primary
      : [{ activity: 'OPERACIONES', description: '', priority: 'MEDIA' }],
    assessments: arrayValue(source.assessments),
    observations: textValue(source.observations),
    strengths: arrayValue(source.strengths),
    weaknesses: arrayValue(source.weaknesses),
    findings: arrayValue(source.findings),
  }
}

function valueChainQuestions(
  summary: ValueChainSummary | null,
  value: UpdateValueChainPayload,
): ValueChainQuestionSummary[] {
  const savedQuestions = arrayValue(summary?.questions)
  const sourceQuestions = savedQuestions.length > 0 ? savedQuestions : valueChainQuestionCatalog
  return sourceQuestions.map((question) => ({
    ...question,
    score: valueChainResponseScore(value, question.questionNumber) ?? question.score ?? null,
  }))
}

function valueChainDimensionScores(
  value: UpdateValueChainPayload,
  questions: ValueChainQuestionSummary[],
  fallbackDimensions: ValueChainSummary['dimensions'],
) {
  if (questions.length === 0) {
    return fallbackDimensions.length > 0
      ? fallbackDimensions
      : (Object.keys(valueChainDimensionLabels) as ValueChainDimension[]).map((dimension) => ({
          dimension,
          ...valueChainDimensionLabels[dimension],
          answeredQuestions: 0,
          score: 0,
          maxScore: 0,
          maturityPercentage: 0,
          improvementPercentage: 0,
        }))
  }
  return (Object.keys(valueChainDimensionLabels) as ValueChainDimension[]).map((dimension) => {
    const dimensionQuestions = questions.filter((question) => question.dimensions.includes(dimension))
    const scored = dimensionQuestions
      .map((question) => value.assessments.find((assessment) => assessment.questionNumber === question.questionNumber))
      .filter((assessment): assessment is ValueChainAssessmentPayload => Boolean(assessment))
    const score = scored.reduce((total, assessment) => total + clamp(assessment.score, 0, 4), 0)
    const maxScore = dimensionQuestions.length * 4
    const maturityPercentage = maxScore === 0 ? 0 : Math.round((score * 100) / maxScore)
    return {
      dimension,
      ...valueChainDimensionLabels[dimension],
      answeredQuestions: scored.length,
      score,
      maxScore,
      maturityPercentage,
      improvementPercentage: Math.max(0, 100 - maturityPercentage),
    }
  })
}

function valueChainResponseScore(value: UpdateValueChainPayload, questionNumber: number) {
  return arrayValue(value.assessments).find((assessment) => assessment.questionNumber === questionNumber)?.score ?? null
}

function valueChainAnsweredCount(value: UpdateValueChainPayload) {
  return arrayValue(value.assessments).filter((assessment) => assessment.questionNumber !== null).length
}

function bcgFormValue(value: UpdateBcgPayload): UpdateBcgPayload {
  const source = value ?? emptyBcg
  const products = arrayValue(source.products)
  const normalizedProducts = products.length > 0
    ? alignBcgTablePeriods(products.map(bcgProductFormValue))
    : [emptyBcgProduct()]
  return {
    products: normalizedProducts,
    marketGrowthThreshold: numberFromValue(source.marketGrowthThreshold, 10),
    relativeMarketShareThreshold: numberFromValue(source.relativeMarketShareThreshold, 1),
    observations: textValue(source.observations),
    strengths: arrayValue(source.strengths),
    weaknesses: arrayValue(source.weaknesses),
    findings: bcgFindingsFromContent(source.findings, source.strengths, source.weaknesses),
  }
}

function bcgProductFormValue(product: Partial<BcgPortfolioItemPayload>): BcgPortfolioItemPayload {
  return {
    name: textValue(product.name),
    description: textValue(product.description),
    annualSales: Math.max(0, numberFromValue(product.annualSales)),
    marketGrowthRate: numberFromValue(product.marketGrowthRate),
    relativeMarketShare: Math.max(0, numberFromValue(product.relativeMarketShare)),
    marketGrowthRates: numericListFromValue(product.marketGrowthRates, false),
    sectorDemandValues: numericListFromValue(product.sectorDemandValues, true),
    competitors: recordsFromValue(product.competitors)
      .map((competitor) => ({
        name: textValue(competitor.name),
        sales: Math.max(0, numberFromValue(competitor.sales)),
      }))
      .slice(0, BCG_MAX_COMPETITORS),
    notes: textValue(product.notes),
  }
}

function bcgDerivedProducts(value: UpdateBcgPayload): BcgDerivedProduct[] {
  const current = {
    ...value,
    products: alignBcgTablePeriods(arrayValue(value.products).map(bcgProductFormValue)),
    marketGrowthThreshold: numberFromValue(value.marketGrowthThreshold, 10),
    relativeMarketShareThreshold: numberFromValue(value.relativeMarketShareThreshold, 1),
  }
  const totalSales = current.products.reduce((total, product) => total + Math.max(0, product.annualSales), 0)
  return current.products.map((product, index) => bcgDerivedProduct(product, current, index, totalSales))
}

function alignBcgTablePeriods(products: BcgPortfolioItemPayload[]) {
  if (products.length === 0) return products
  const growthLists = products.map((product) => bcgPeriodList(product.marketGrowthRates, BCG_DEFAULT_GROWTH_PERIODS))
  const demandLists = products.map((product) => bcgPeriodList(product.sectorDemandValues, BCG_DEFAULT_DEMAND_PERIODS, true))
  const growthSize = Math.max(1, ...growthLists.map((list) => list.length))
  const demandSize = Math.max(1, ...demandLists.map((list) => list.length))
  return products.map((product, index) => ({
    ...product,
    marketGrowthRates: padBcgPeriodList(growthLists[index], growthSize),
    sectorDemandValues: padBcgPeriodList(demandLists[index], demandSize),
  }))
}

function padBcgPeriodList(values: number[], size: number) {
  return Array.from({ length: size }, (_, index) => values[index] ?? 0)
}

function bcgDerivedProduct(
  product: BcgPortfolioItemPayload,
  value: UpdateBcgPayload,
  position: number,
  totalSales: number,
): BcgDerivedProduct {
  const current = bcgProductFormValue(product)
  const competitors = cleanBcgCompetitors(current.competitors)
  const largestCompetitorSales = competitors.reduce((largest, competitor) => Math.max(largest, competitor.sales), 0)
  const marketGrowthRate = current.marketGrowthRates.length > 0
    ? bcgAverageMarketGrowth(current.marketGrowthRates, current.marketGrowthRate)
    : current.marketGrowthRate
  const relativeMarketShare = largestCompetitorSales > 0
    ? roundNumber(Math.min(2, current.annualSales / largestCompetitorSales))
    : current.relativeMarketShare
  const salesPercentage = totalSales > 0 ? roundNumber((current.annualSales * 100) / totalSales) : 0
  const quadrant = classifyBcg(
    marketGrowthRate,
    relativeMarketShare,
    value.marketGrowthThreshold || 10,
    value.relativeMarketShareThreshold > 0 ? value.relativeMarketShareThreshold : 1,
  )
  return {
    ...current,
    competitors,
    marketGrowthRate,
    relativeMarketShare,
    salesPercentage,
    largestCompetitorSales,
    quadrant,
    position,
  }
}

function bcgAverageMarketGrowth(values: number[], fallback: number) {
  const rates = numericListFromValue(values, false)
  if (rates.length === 0) return fallback
  const average = rates.reduce((total, rate) => total + rate, 0) / rates.length
  return roundNumber(Math.min(20, average))
}

function bcgResultCounts(products: BcgDerivedProduct[]) {
  return {
    stars: products.filter((product) => product.quadrant === 'ESTRELLA').length,
    questionMarks: products.filter((product) => product.quadrant === 'INCOGNITA').length,
    cashCows: products.filter((product) => product.quadrant === 'VACA').length,
    dogs: products.filter((product) => product.quadrant === 'PERRO').length,
  }
}

function cleanBcgCompetitors(competitors: BcgPortfolioItemPayload['competitors']) {
  return arrayValue(competitors)
    .map((competitor) => ({
      name: competitor.name.trim(),
      sales: Math.max(0, numberFromValue(competitor.sales)),
    }))
    .filter((competitor) => competitor.name || competitor.sales > 0)
    .slice(0, BCG_MAX_COMPETITORS)
}

function numericListFromValue(value: unknown, nonNegative: boolean) {
  return Array.isArray(value)
    ? value
        .map((item) => numberFromValue(item))
        .filter((item) => Number.isFinite(item))
        .map((item) => (nonNegative ? Math.max(0, item) : item))
    : []
}

function bcgPeriodList(value: unknown, fallbackSize: number, nonNegative = false) {
  const values = numericListFromValue(value, nonNegative)
  return values.length > 0 ? values : Array.from({ length: fallbackSize }, () => 0)
}

function roundNumber(value: number) {
  return Math.round(value * 100) / 100
}

function bcgQuadrantLabel(quadrant: BcgQuadrant) {
  if (quadrant === 'ESTRELLA') return 'Estrella'
  if (quadrant === 'INCOGNITA') return 'Incognita'
  if (quadrant === 'VACA') return 'Vaca'
  return 'Perro'
}

function bcgDecisionLabel(quadrant: BcgQuadrant) {
  if (quadrant === 'ESTRELLA') return 'potenciar'
  if (quadrant === 'INCOGNITA') return 'evaluar'
  if (quadrant === 'VACA') return 'mantener'
  return 'reestructurar o desinvertir'
}

function emptyValueChainFinding(category: 'FORTALEZA' | 'DEBILIDAD'): DiagnosticFindingPayload {
  return {
    sourceDimension: 'OPERACIONES',
    category,
    description: '',
    evidence: '',
    impact: '',
    priority: 'MEDIA',
    selectedForFoda: true,
  }
}

function emptyBcgFinding(category: 'FORTALEZA' | 'DEBILIDAD'): DiagnosticFindingPayload {
  return {
    sourceDimension: category === 'FORTALEZA' ? 'ESTRELLA' : 'PERRO',
    category,
    description: '',
    evidence: '',
    impact: '',
    priority: 'MEDIA',
    selectedForFoda: true,
  }
}

function bcgFindingDimensionValue(value: unknown) {
  return bcgFindingDimensions.includes(value as typeof bcgFindingDimensions[number])
    ? value as typeof bcgFindingDimensions[number]
    : 'BCG'
}

function bcgFindingsFromContent(
  findings: unknown,
  strengths: unknown,
  weaknesses: unknown,
): DiagnosticFindingPayload[] {
  const parsed = recordsFromValue(findings)
    .map((finding) => ({
      sourceDimension: bcgFindingDimensionValue(finding.sourceDimension),
      category: finding.category === 'DEBILIDAD' ? 'DEBILIDAD' as const : 'FORTALEZA' as const,
      description: textValue(finding.description).trim(),
      evidence: textValue(finding.evidence).trim(),
      impact: textValue(finding.impact).trim(),
      priority: priorityValue(finding.priority),
      selectedForFoda: finding.selectedForFoda !== false,
    }))
  if (parsed.length > 0) return parsed
  return [
    ...stringListFromValue(strengths).map((description) => ({ ...emptyBcgFinding('FORTALEZA'), description })),
    ...stringListFromValue(weaknesses).map((description) => ({ ...emptyBcgFinding('DEBILIDAD'), description })),
  ]
}

function BcgMatrix({ value }: { value: UpdateBcgPayload }) {
  const current = bcgFormValue(value)
  const products = bcgDerivedProducts(current)
    .filter((product) => product.name.trim())
    .map((product, index) => ({ ...product, name: product.name.trim() || `Producto ${index + 1}` }))
  const shareThreshold = current.relativeMarketShareThreshold > 0 ? current.relativeMarketShareThreshold : 1
  const maxSalesPercentage = Math.max(1, ...products.map((product) => product.salesPercentage))
  const bubbles = products.map((product) => {
    return {
      ...product,
      size: 18 + (Math.max(0, product.salesPercentage) / maxSalesPercentage) * 26,
      x: matrixCoordinate(product.relativeMarketShare, shareThreshold),
      y: 100 - matrixCoordinate(product.marketGrowthRate, current.marketGrowthThreshold || 10),
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
            title={`${product.name}: ${bcgQuadrantLabel(product.quadrant)}`}
          >
            {index + 1}
          </span>
        ))}
      </div>
      <div className="diag-bcg-legend">
        {bubbles.length === 0 && <span>Agregue productos para graficar la matriz.</span>}
        {bubbles.map((product, index) => (
          <span key={`${product.name}-legend-${index}`}>
            {index + 1}. {product.name} - {bcgQuadrantLabel(product.quadrant)}
          </span>
        ))}
      </div>
    </div>
  )
}

function BcgFindingsEditor({
  onChange,
  value,
}: {
  onChange: (value: UpdateBcgPayload) => void
  value: UpdateBcgPayload
}) {
  const current = bcgFormValue(value)
  const indexedFindings = current.findings.map((finding, index) => ({ finding, index }))
  const strengthFindings = indexedFindings.filter(({ finding }) => finding.category === 'FORTALEZA')
  const weaknessFindings = indexedFindings.filter(({ finding }) => finding.category === 'DEBILIDAD')

  function addFinding(category: 'FORTALEZA' | 'DEBILIDAD') {
    onChange({ ...current, findings: [...current.findings, emptyBcgFinding(category)] })
  }

  function updateFinding(index: number, patch: Partial<DiagnosticFindingPayload>) {
    onChange({
      ...current,
      findings: current.findings.map((finding, itemIndex) => itemIndex === index ? { ...finding, ...patch } : finding),
    })
  }

  function removeFinding(index: number) {
    onChange({ ...current, findings: current.findings.filter((_, itemIndex) => itemIndex !== index) })
  }

  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <div>
          <h3>Hallazgos BCG</h3>
          <p className="diag-panel-copy">Registre fortalezas y debilidades del portafolio para llevarlas a la matriz FODA.</p>
        </div>
        <div className="diag-pest-finding-actions">
          <button className="gplan-inline-btn" type="button" onClick={() => addFinding('FORTALEZA')}>
            <Plus size={14} />
            Fortaleza
          </button>
          <button className="gplan-inline-btn" type="button" onClick={() => addFinding('DEBILIDAD')}>
            <Plus size={14} />
            Debilidad
          </button>
        </div>
      </div>
      <div className="diag-bcg-synthesis">
        <label className="field diag-chain-observation">
          <span className="field-label">Observaciones</span>
          <textarea
            rows={3}
            value={current.observations}
            onChange={(event) => onChange({ ...current, observations: event.target.value })}
            placeholder="Lectura general del diagnostico"
          />
        </label>
        <div className="diag-bcg-finding-columns">
          <BcgFindingColumn
            category="FORTALEZA"
            emptyMessage="Todavia no se registraron fortalezas BCG."
            entries={strengthFindings}
            title="Fortalezas"
            onRemove={removeFinding}
            onUpdate={updateFinding}
          />
          <BcgFindingColumn
            category="DEBILIDAD"
            emptyMessage="Todavia no se registraron debilidades BCG."
            entries={weaknessFindings}
            title="Debilidades"
            onRemove={removeFinding}
            onUpdate={updateFinding}
          />
        </div>
      </div>
    </section>
  )
}

function BcgFindingColumn({
  category,
  emptyMessage,
  entries,
  onRemove,
  onUpdate,
  title,
}: {
  category: 'FORTALEZA' | 'DEBILIDAD'
  emptyMessage: string
  entries: Array<{ finding: DiagnosticFindingPayload; index: number }>
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<DiagnosticFindingPayload>) => void
  title: string
}) {
  return (
    <section className="diag-bcg-finding-group">
      <div className="diag-bcg-finding-group-head">
        <div className="diag-bcg-finding-group-title">
          <span className={`diag-pest-kind ${category.toLowerCase()}`}>{title}</span>
          <small>{entries.length} registradas</small>
        </div>
      </div>
      {entries.length === 0 && <p className="gplan-muted">{emptyMessage}</p>}
      <div className="diag-pest-findings">
        {entries.map(({ finding, index }) => (
          <BcgFindingCard
            finding={finding}
            index={index}
            key={index}
            onRemove={onRemove}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </section>
  )
}

function BcgFindingCard({
  finding,
  index,
  onRemove,
  onUpdate,
}: {
  finding: DiagnosticFindingPayload
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<DiagnosticFindingPayload>) => void
}) {
  return (
    <article className="diag-pest-finding">
      <div className="diag-pest-finding-head">
        <span className={`diag-pest-kind ${finding.category.toLowerCase()}`}>{finding.category}</span>
        <button className="gplan-remove-btn" title="Eliminar hallazgo" type="button" onClick={() => onRemove(index)}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="diag-pest-finding-grid">
        <label>
          <span>Origen BCG</span>
          <select
            value={bcgFindingDimensionValue(finding.sourceDimension)}
            onChange={(event) => onUpdate(index, { sourceDimension: event.target.value })}
          >
            {bcgFindingDimensions.map((dimension) => (
              <option key={dimension} value={dimension}>{bcgFindingDimensionLabels[dimension]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Prioridad</span>
          <select
            value={finding.priority}
            onChange={(event) => onUpdate(index, { priority: event.target.value as DiagnosticPriority })}
          >
            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="wide">
          <span>Descripcion</span>
          <textarea
            rows={2}
            value={finding.description}
            onChange={(event) => onUpdate(index, { description: event.target.value })}
            placeholder="Explique la fortaleza o debilidad del portafolio"
          />
        </label>
        <label>
          <span>Evidencia</span>
          <textarea
            rows={2}
            value={finding.evidence}
            onChange={(event) => onUpdate(index, { evidence: event.target.value })}
            placeholder="Dato o cuadrante que sustenta el hallazgo"
          />
        </label>
        <label>
          <span>Impacto esperado</span>
          <textarea
            rows={2}
            value={finding.impact}
            onChange={(event) => onUpdate(index, { impact: event.target.value })}
            placeholder="Como afecta a la organizacion"
          />
        </label>
      </div>
      <label className="diag-pest-foda-check">
        <input
          checked={finding.selectedForFoda}
          type="checkbox"
          onChange={(event) => onUpdate(index, { selectedForFoda: event.target.checked })}
        />
        <CheckCircle2 size={15} />
        Seleccionar para la matriz FODA
      </label>
    </article>
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
    strengths: swotItems(arrayValue(summary.strengths)),
    opportunities: swotItems(arrayValue(summary.opportunities)),
    weaknesses: swotItems(arrayValue(summary.weaknesses)),
    threats: swotItems(arrayValue(summary.threats)),
  }
}

function pestPayloadFromSummary(summary: PestSummary): UpdatePestPayload {
  return {
    responses: arrayValue(summary.questions)
      .filter((question) => question.score !== null)
      .map((question) => ({ questionNumber: question.questionNumber, score: question.score })),
    findings: arrayValue(summary.findings).map((finding) => ({
      sourceDimension: finding.sourceDimension,
      category: finding.category,
      description: finding.description,
      evidence: finding.evidence,
      impact: finding.impact,
      priority: finding.priority,
      selectedForFoda: finding.selectedForFoda,
    })),
  }
}

function swotItems(items: Array<{ description: string; priority: DiagnosticPriority }>) {
  const next = items.map((item) => ({ description: item.description, priority: item.priority }))
  return next.length > 0 ? next : [{ description: '', priority: 'MEDIA' as DiagnosticPriority }]
}

function valueChainPayloadFromSummary(summary: ValueChainSummary): UpdateValueChainPayload {
  const summaryAssessments = arrayValue(summary.assessments)
  const summaryFindings = arrayValue(summary.findings)
  const summaryStrengths = arrayValue(summary.strengths)
  const summaryWeaknesses = arrayValue(summary.weaknesses)
  const questions = arrayValue(summary.questions).length > 0
    ? arrayValue(summary.questions)
    : valueChainQuestionCatalog
  return {
    supportActivities: activityItems(arrayValue(summary.supportActivities), 'DESARROLLO_TECNOLOGICO'),
    primaryActivities: activityItems(arrayValue(summary.primaryActivities), 'OPERACIONES'),
    assessments: questions
      .map<ValueChainAssessmentPayload | null>((question) => {
        const saved = summaryAssessments.find((assessment) => assessment.questionNumber === question.questionNumber)
        const score = question.score ?? saved?.score ?? null
        if (score === null) return null
        return {
          questionNumber: question.questionNumber,
          activity: question.activity,
          statement: question.statement,
          score,
          notes: saved?.notes ?? '',
        }
      })
      .filter((assessment): assessment is ValueChainAssessmentPayload => Boolean(assessment)),
    observations: textValue(summary.observations),
    strengths: summaryStrengths,
    weaknesses: summaryWeaknesses,
    findings: summaryFindings.length > 0
      ? summaryFindings.map((finding) => ({
          sourceDimension: finding.sourceDimension,
          category: finding.category,
          description: finding.description,
          evidence: finding.evidence,
          impact: finding.impact,
          priority: finding.priority,
          selectedForFoda: finding.selectedForFoda,
        }))
      : [
          ...summaryStrengths.map((description) => ({
            ...emptyValueChainFinding('FORTALEZA'),
            description,
          })),
          ...summaryWeaknesses.map((description) => ({
            ...emptyValueChainFinding('DEBILIDAD'),
            description,
          })),
        ],
  }
}

function activityItems(
  items: Array<{ activity: ValueChainActivity; description: string; priority: DiagnosticPriority }>,
  fallback: ValueChainActivity,
) {
  const next = arrayValue(items).map((item) => ({
    activity: item.activity,
    description: item.description,
    priority: item.priority,
  }))
  return next.length > 0 ? next : [{ activity: fallback, description: '', priority: 'MEDIA' as DiagnosticPriority }]
}

function bcgPayloadFromSummary(summary: BcgSummary): UpdateBcgPayload {
  const products = arrayValue(summary.products)
  const summaryFindings = arrayValue(summary.findings)
  const summaryStrengths = arrayValue(summary.strengths)
  const summaryWeaknesses = arrayValue(summary.weaknesses)
  return {
    products: products.length > 0
      ? products.map((product) => ({
          name: product.name,
          description: product.description,
          annualSales: product.annualSales,
          marketGrowthRate: product.marketGrowthRate,
          relativeMarketShare: product.relativeMarketShare,
          marketGrowthRates: numericListFromValue(product.marketGrowthRates, false),
          sectorDemandValues: numericListFromValue(product.sectorDemandValues, true),
          competitors: recordsFromValue(product.competitors)
            .map((competitor) => ({
              name: textValue(competitor.name),
              sales: Math.max(0, numberFromValue(competitor.sales)),
            }))
            .slice(0, BCG_MAX_COMPETITORS),
          notes: product.notes,
        }))
      : [emptyBcgProduct()],
    marketGrowthThreshold: summary.marketGrowthThreshold || 10,
    relativeMarketShareThreshold: summary.relativeMarketShareThreshold || 1,
    observations: summary.observations,
    strengths: summaryStrengths,
    weaknesses: summaryWeaknesses,
    findings: summaryFindings.length > 0
      ? summaryFindings.map((finding) => ({
          sourceDimension: bcgFindingDimensionValue(finding.sourceDimension),
          category: finding.category === 'DEBILIDAD' ? 'DEBILIDAD' as const : 'FORTALEZA' as const,
          description: finding.description,
          evidence: finding.evidence,
          impact: finding.impact,
          priority: finding.priority,
          selectedForFoda: finding.selectedForFoda,
        }))
      : bcgFindingsFromContent([], summaryStrengths, summaryWeaknesses),
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

function swotSuggestionsFromDiagnostics(
  pest: UpdatePestPayload,
  porter: UpdatePorterPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
): SwotSourceSuggestion[] {
  return dedupeSwotSuggestions([
    ...swotSuggestionsFromFindings('PEST', pest.findings),
    ...swotSuggestionsFromFindings('Porter', porter.findings),
    ...swotSuggestionsFromFindings('Cadena de valor', valueChain.findings),
    ...swotSuggestionsFromFindings('BCG', bcg.findings),
  ])
}

function swotSuggestionsFromFindings(
  source: string,
  findings: DiagnosticFindingPayload[] | null | undefined,
): SwotSourceSuggestion[] {
  return arrayValue(findings)
    .filter((finding) => finding.selectedForFoda !== false)
    .map((finding) => {
      const key = swotKeyForFindingCategory(finding.category)
      if (!key) return null
      return {
        key,
        description: textValue(finding.description).trim(),
        priority: priorityValue(finding.priority),
        source,
        sourceDimension: textValue(finding.sourceDimension).trim(),
      }
    })
    .filter((item): item is SwotSourceSuggestion => Boolean(item && item.description))
}

function swotKeyForFindingCategory(category: DiagnosticFindingPayload['category']): SwotKey | null {
  if (category === 'FORTALEZA') return 'strengths'
  if (category === 'OPORTUNIDAD') return 'opportunities'
  if (category === 'DEBILIDAD') return 'weaknesses'
  if (category === 'AMENAZA') return 'threats'
  return null
}

function dedupeSwotSuggestions(items: SwotSourceSuggestion[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.key}:${normalizeTextKey(item.description)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function swotPayloadFromSuggestions(suggestions: SwotSourceSuggestion[]): UpdateSwotPayload {
  return {
    strengths: suggestionsToSwotItems(suggestions, 'strengths'),
    opportunities: suggestionsToSwotItems(suggestions, 'opportunities'),
    weaknesses: suggestionsToSwotItems(suggestions, 'weaknesses'),
    threats: suggestionsToSwotItems(suggestions, 'threats'),
  }
}

function suggestionsToSwotItems(suggestions: SwotSourceSuggestion[], key: SwotKey): SwotItemPayload[] {
  return suggestions
    .filter((suggestion) => suggestion.key === key)
    .map((suggestion) => ({
      description: suggestion.description,
      priority: suggestion.priority,
    }))
}

function mergeSwotWithSuggestions(current: UpdateSwotPayload, suggestions: SwotSourceSuggestion[]): UpdateSwotPayload {
  const cleanCurrent = cleanSwot(current)
  const suggested = swotPayloadFromSuggestions(suggestions)
  return {
    strengths: mergeSwotItems(cleanCurrent.strengths, suggested.strengths),
    opportunities: mergeSwotItems(cleanCurrent.opportunities, suggested.opportunities),
    weaknesses: mergeSwotItems(cleanCurrent.weaknesses, suggested.weaknesses),
    threats: mergeSwotItems(cleanCurrent.threats, suggested.threats),
  }
}

function mergeSwotItems(current: SwotItemPayload[], incoming: SwotItemPayload[]) {
  const seen = new Set<string>()
  return [...current, ...incoming]
    .map((item) => ({ description: item.description.trim(), priority: item.priority }))
    .filter((item) => {
      if (!item.description) return false
      const key = normalizeTextKey(item.description)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function swotHasContent(value: UpdateSwotPayload) {
  const clean = cleanSwot(value)
  return clean.strengths.length > 0
    || clean.opportunities.length > 0
    || clean.weaknesses.length > 0
    || clean.threats.length > 0
}

function cleanValueChain(value: UpdateValueChainPayload): UpdateValueChainPayload {
  const current = valueChainFormValue(value)
  return {
    supportActivities: cleanActivities(current.supportActivities),
    primaryActivities: cleanActivities(current.primaryActivities),
    assessments: current.assessments
      .map((item) => ({
        questionNumber: item.questionNumber,
        activity: item.activity,
        statement: item.statement.trim(),
        score: clamp(item.score, 0, 4),
        notes: item.notes.trim(),
      }))
      .filter((item) => item.questionNumber !== null || item.statement),
    observations: current.observations.trim(),
    strengths: cleanLines(current.strengths),
    weaknesses: cleanLines(current.weaknesses),
    findings: current.findings
      .map((finding) => ({
        ...finding,
        description: finding.description.trim(),
        evidence: finding.evidence.trim(),
        impact: finding.impact.trim(),
      }))
      .filter((finding) => finding.description),
  }
}

function cleanActivities(items: ValueChainActivityPayload[]) {
  return arrayValue(items)
    .map((item) => ({
      activity: item.activity,
      description: item.description.trim(),
      priority: item.priority,
    }))
    .filter((item) => item.description)
}

function cleanBcg(value: UpdateBcgPayload): UpdateBcgPayload {
  const current = bcgFormValue(value)
  const findings = current.findings
    .map((finding) => ({
      ...finding,
      sourceDimension: bcgFindingDimensionValue(finding.sourceDimension),
      category: finding.category === 'DEBILIDAD' ? 'DEBILIDAD' as const : 'FORTALEZA' as const,
      description: finding.description.trim(),
      evidence: finding.evidence.trim(),
      impact: finding.impact.trim(),
      priority: priorityValue(finding.priority),
      selectedForFoda: finding.selectedForFoda,
    }))
    .filter((finding) => finding.description)
  const findingStrengths = findings
    .filter((finding) => finding.category === 'FORTALEZA')
    .map((finding) => finding.description)
  const findingWeaknesses = findings
    .filter((finding) => finding.category === 'DEBILIDAD')
    .map((finding) => finding.description)
  return {
    products: current.products
      .map((product) => {
        const competitors = cleanBcgCompetitors(product.competitors)
        const marketGrowthRates = numericListFromValue(product.marketGrowthRates, false)
        const sectorDemandValues = numericListFromValue(product.sectorDemandValues, true)
        const derived = bcgDerivedProduct(
          { ...product, competitors, marketGrowthRates, sectorDemandValues },
          current,
          0,
          0,
        )
        return {
          name: product.name.trim(),
          description: product.description.trim(),
          annualSales: Math.max(0, product.annualSales),
          marketGrowthRate: derived.marketGrowthRate,
          relativeMarketShare: Math.max(0, derived.relativeMarketShare),
          marketGrowthRates,
          sectorDemandValues,
          competitors,
          notes: product.notes.trim(),
        }
      })
      .filter((product) => product.name),
    marketGrowthThreshold: current.marketGrowthThreshold,
    relativeMarketShareThreshold: current.relativeMarketShareThreshold,
    observations: current.observations.trim(),
    strengths: findingStrengths.length > 0 ? findingStrengths : cleanLines(current.strengths),
    weaknesses: findingWeaknesses.length > 0 ? findingWeaknesses : cleanLines(current.weaknesses),
    findings,
  }
}

function cleanPest(value: UpdatePestPayload): UpdatePestPayload {
  return {
    responses: arrayValue(value.responses)
      .filter((response) => response.score !== null)
      .map((response) => ({
        questionNumber: response.questionNumber,
        score: response.score === null ? null : clamp(response.score, 0, 4),
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber),
    findings: arrayValue(value.findings)
      .map((finding) => ({
        ...finding,
        description: finding.description.trim(),
        evidence: finding.evidence.trim(),
        impact: finding.impact.trim(),
      }))
      .filter((finding) => finding.description),
  }
}

function porterPayloadFromSummary(summary: PorterSummary): UpdatePorterPayload {
  return {
    responses: arrayValue(summary.questions)
      .filter((question) => question.score !== null)
      .map((question) => ({ questionNumber: question.questionNumber, score: question.score })),
    findings: arrayValue(summary.findings).map((finding) => ({
      sourceDimension: finding.sourceDimension,
      category: finding.category,
      description: finding.description,
      evidence: finding.evidence,
      impact: finding.impact,
      priority: finding.priority,
      selectedForFoda: finding.selectedForFoda,
    })),
  }
}

function cleanPorter(value: UpdatePorterPayload): UpdatePorterPayload {
  return {
    responses: arrayValue(value.responses)
      .filter((response) => response.score !== null)
      .map((response) => ({
        questionNumber: response.questionNumber,
        score: response.score === null ? null : clamp(response.score, 0, 4),
      }))
      .sort((a, b) => a.questionNumber - b.questionNumber),
    findings: arrayValue(value.findings)
      .map((finding) => ({
        ...finding,
        description: finding.description.trim(),
        evidence: finding.evidence.trim(),
        impact: finding.impact.trim(),
      }))
      .filter((finding) => finding.description),
  }
}

function validateActiveTool(
  activeTool: DiagnosticToolKey,
  pest: UpdatePestPayload,
  porter: UpdatePorterPayload,
  swot: UpdateSwotPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
) {
  if (activeTool === 'pest') {
    const payload = cleanPest(pest)
    if (payload.responses.length !== 25) {
      return 'Responda las 25 preguntas PEST antes de enviar a revision.'
    }
    if (!payload.findings.some((finding) => finding.category === 'OPORTUNIDAD')
      || !payload.findings.some((finding) => finding.category === 'AMENAZA')) {
      return 'Registre al menos una oportunidad y una amenaza derivadas del analisis PEST.'
    }
  }
  if (activeTool === 'porter') {
    const payload = cleanPorter(porter)
    if (payload.responses.length !== 25) {
      return 'Responda las 25 preguntas Porter antes de enviar a revision.'
    }
    if (!payload.findings.some((finding) => finding.category === 'OPORTUNIDAD')
      || !payload.findings.some((finding) => finding.category === 'AMENAZA')) {
      return 'Registre al menos una oportunidad y una amenaza derivadas del analisis Porter.'
    }
  }
  if (activeTool === 'foda') {
    const payload = cleanSwot(swot)
    if (!payload.strengths.length || !payload.opportunities.length || !payload.weaknesses.length || !payload.threats.length) {
      return 'Complete al menos un item en fortalezas, oportunidades, debilidades y amenazas.'
    }
  }
  if (activeTool === 'valueChain') {
    const payload = cleanValueChain(valueChain)
    if (payload.assessments.filter((assessment) => assessment.questionNumber !== null).length !== 25) {
      return 'Responda las 25 preguntas de cadena de valor antes de enviar a revision.'
    }
    if (!payload.findings.some((finding) => finding.category === 'FORTALEZA')
      || !payload.findings.some((finding) => finding.category === 'DEBILIDAD')) {
      return 'Registre al menos una fortaleza y una debilidad derivadas de la cadena de valor.'
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
    if (!payload.findings.some((finding) => finding.category === 'FORTALEZA')
      || !payload.findings.some((finding) => finding.category === 'DEBILIDAD')) {
      return 'Registre al menos una fortaleza y una debilidad derivadas del BCG.'
    }
  }
  return ''
}

function diagnosticChangeRequestPayload(
  activeTool: DiagnosticToolKey,
  pest: UpdatePestPayload,
  porter: UpdatePorterPayload,
  swot: UpdateSwotPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
  swotSummary: SwotSummary | null,
  valueChainSummary: ValueChainSummary | null,
  bcgSummary: BcgSummary | null,
  pestSummary: PestSummary | null,
  porterSummary: PorterSummary | null,
): CreatePhaseChangeRequestPayload {
  const title = activeTool === 'pest'
    ? 'Aprobar analisis PEST'
    : activeTool === 'porter'
    ? 'Aprobar analisis Porter'
    : activeTool === 'foda'
    ? 'Aprobar FODA'
    : activeTool === 'valueChain'
      ? 'Aprobar cadena de valor'
      : 'Aprobar BCG'
  const content = activeTool === 'pest'
    ? { pest: cleanPest(pest) }
    : activeTool === 'porter'
    ? { porter: cleanPorter(porter) }
    : activeTool === 'foda'
    ? { swot: cleanSwot(swot) }
    : activeTool === 'valueChain'
      ? { valueChain: cleanValueChain(valueChain) }
      : { bcg: cleanBcg(bcg) }
  return {
    title,
    description: 'Solicitud para aprobar una herramienta del bloque diagnostico.',
    proposedContent: content,
    entries: diagnosticEntries(
      activeTool,
      pest,
      porter,
      swot,
      valueChain,
      bcg,
      pestSummary,
      porterSummary,
      swotSummary,
      valueChainSummary,
      bcgSummary,
    ),
  }
}

function diagnosticEntries(
  activeTool: DiagnosticToolKey,
  pest: UpdatePestPayload,
  porter: UpdatePorterPayload,
  swot: UpdateSwotPayload,
  valueChain: UpdateValueChainPayload,
  bcg: UpdateBcgPayload,
  pestSummary: PestSummary | null,
  porterSummary: PorterSummary | null,
  swotSummary: SwotSummary | null,
  valueChainSummary: ValueChainSummary | null,
  bcgSummary: BcgSummary | null,
): PhaseChangeEntry[] {
  if (activeTool === 'pest') {
    const current = cleanPest(pestSummary ? pestPayloadFromSummary(pestSummary) : emptyPest)
    const next = cleanPest(pest)
    return [
      diagnosticEntry('pest.responses', current.responses, next.responses),
      diagnosticEntry('pest.findings', current.findings, next.findings),
    ].filter((entry) => entry.previousValue !== entry.proposedValue)
  }

  if (activeTool === 'porter') {
    const current = cleanPorter(porterSummary ? porterPayloadFromSummary(porterSummary) : emptyPorter)
    const next = cleanPorter(porter)
    return [
      diagnosticEntry('porter.responses', current.responses, next.responses),
      diagnosticEntry('porter.findings', current.findings, next.findings),
    ].filter((entry) => entry.previousValue !== entry.proposedValue)
  }

  if (activeTool === 'foda') {
    const current = cleanSwot(swotSummary ? swotPayloadFromSummary(swotSummary) : emptySwot)
    const next = cleanSwot(swot)
    return [
      diagnosticEntry('strengths', current.strengths, next.strengths),
      diagnosticEntry('opportunities', current.opportunities, next.opportunities),
      diagnosticEntry('weaknesses', current.weaknesses, next.weaknesses),
      diagnosticEntry('threats', current.threats, next.threats),
    ].filter((entry) => entry.previousValue !== entry.proposedValue)
  }

  if (activeTool === 'valueChain') {
    const current = cleanValueChain(valueChainSummary ? valueChainPayloadFromSummary(valueChainSummary) : emptyValueChain)
    const next = cleanValueChain(valueChain)
    return [
      diagnosticEntry('supportActivities', current.supportActivities, next.supportActivities),
      diagnosticEntry('primaryActivities', current.primaryActivities, next.primaryActivities),
      diagnosticEntry('assessments', current.assessments, next.assessments),
      diagnosticEntry('findings', current.findings, next.findings),
      diagnosticEntry('observations', current.observations, next.observations),
      diagnosticEntry('strengths', current.strengths, next.strengths),
      diagnosticEntry('weaknesses', current.weaknesses, next.weaknesses),
    ].filter((entry) => entry.previousValue !== entry.proposedValue)
  }

  const current = cleanBcg(bcgSummary ? bcgPayloadFromSummary(bcgSummary) : emptyBcg)
  const next = cleanBcg(bcg)
  return [
    diagnosticEntry('products', current.products, next.products),
    diagnosticEntry('marketGrowthThreshold', current.marketGrowthThreshold, next.marketGrowthThreshold),
    diagnosticEntry('relativeMarketShareThreshold', current.relativeMarketShareThreshold, next.relativeMarketShareThreshold),
    diagnosticEntry('findings', current.findings, next.findings),
    diagnosticEntry('observations', current.observations, next.observations),
    diagnosticEntry('strengths', current.strengths, next.strengths),
    diagnosticEntry('weaknesses', current.weaknesses, next.weaknesses),
  ].filter((entry) => entry.previousValue !== entry.proposedValue)
}

function diagnosticEntry(fieldKey: string, previousValue: unknown, proposedValue: unknown): PhaseChangeEntry {
  return {
    fieldKey,
    previousValue: stringifyDiagnosticValue(previousValue),
    proposedValue: stringifyDiagnosticValue(proposedValue),
  }
}

function stringifyDiagnosticValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
}

function diagnosticPayloadFromCurrent(
  activeTool: DiagnosticToolKey,
  pestSummary: PestSummary | null,
  porterSummary: PorterSummary | null,
  swotSummary: SwotSummary | null,
  valueChainSummary: ValueChainSummary | null,
  bcgSummary: BcgSummary | null,
): DiagnosticPreviewPayload {
  if (activeTool === 'pest') {
    return { tool: 'pest', pest: pestSummary ? pestPayloadFromSummary(pestSummary) : emptyPest }
  }
  if (activeTool === 'porter') {
    return { tool: 'porter', porter: porterSummary ? porterPayloadFromSummary(porterSummary) : emptyPorter }
  }
  if (activeTool === 'foda') {
    return { tool: 'foda', swot: swotSummary ? swotPayloadFromSummary(swotSummary) : emptySwot }
  }
  if (activeTool === 'valueChain') {
    return {
      tool: 'valueChain',
      valueChain: valueChainSummary ? valueChainPayloadFromSummary(valueChainSummary) : emptyValueChain,
    }
  }
  return { tool: 'bcg', bcg: bcgSummary ? bcgPayloadFromSummary(bcgSummary) : emptyBcg }
}

function diagnosticPayloadFromContent(
  content: unknown,
  fallbackTool: DiagnosticToolKey,
): DiagnosticPreviewPayload {
  const source = recordValue(content)
  const tool = diagnosticToolFromContent(source, fallbackTool)
  if (tool === 'pest') {
    return { tool, pest: pestPayloadFromContent(source.pest) }
  }
  if (tool === 'porter') {
    return { tool, porter: porterPayloadFromContent(source.porter) }
  }
  if (tool === 'foda') {
    return { tool, swot: swotPayloadFromContent(source.swot) }
  }
  if (tool === 'valueChain') {
    return { tool, valueChain: valueChainPayloadFromContent(source.valueChain) }
  }
  return { tool, bcg: bcgPayloadFromContent(source.bcg) }
}

function diagnosticToolFromContent(
  content: unknown,
  fallbackTool: DiagnosticToolKey = 'foda',
): DiagnosticToolKey {
  if (contentHasTool(content, 'pest')) return 'pest'
  if (contentHasTool(content, 'porter')) return 'porter'
  if (contentHasTool(content, 'foda')) return 'foda'
  if (contentHasTool(content, 'valueChain')) return 'valueChain'
  if (contentHasTool(content, 'bcg')) return 'bcg'
  return fallbackTool
}

function diagnosticToolLabel(tool: DiagnosticToolKey) {
  return diagnosticTools.find((item) => item.key === tool)?.title ?? 'Diagnostico'
}

function diagnosticAreaForTool(tool: DiagnosticToolKey): DiagnosticAreaKey {
  if (tool === 'pest' || tool === 'porter') return 'external'
  if (tool === 'valueChain' || tool === 'bcg') return 'internal'
  return 'foda'
}

function userNameById(group: PlanningGroupSummary | null, userId?: number | null) {
  if (!userId) return '-'
  const member = group?.members.find((item) => item.userId === userId)
  return member ? `${member.firstName} ${member.lastName}` : `Usuario #${userId}`
}

function editorSwotPayload(value: UpdateSwotPayload): UpdateSwotPayload {
  const cleaned = cleanSwot(value)
  return {
    strengths: cleaned.strengths.length > 0 ? cleaned.strengths : [{ description: '', priority: 'MEDIA' }],
    opportunities: cleaned.opportunities.length > 0 ? cleaned.opportunities : [{ description: '', priority: 'MEDIA' }],
    weaknesses: cleaned.weaknesses.length > 0 ? cleaned.weaknesses : [{ description: '', priority: 'MEDIA' }],
    threats: cleaned.threats.length > 0 ? cleaned.threats : [{ description: '', priority: 'MEDIA' }],
  }
}

function editorPestPayload(value: UpdatePestPayload): UpdatePestPayload {
  return cleanPest(value)
}

function editorPorterPayload(value: UpdatePorterPayload): UpdatePorterPayload {
  return cleanPorter(value)
}

function editorValueChainPayload(value: UpdateValueChainPayload): UpdateValueChainPayload {
  const cleaned = cleanValueChain(value)
  return {
    supportActivities: cleaned.supportActivities.length > 0
      ? cleaned.supportActivities
      : [{ activity: 'DESARROLLO_TECNOLOGICO', description: '', priority: 'MEDIA' }],
    primaryActivities: cleaned.primaryActivities.length > 0
      ? cleaned.primaryActivities
      : [{ activity: 'OPERACIONES', description: '', priority: 'MEDIA' }],
    assessments: cleaned.assessments.length > 0
      ? cleaned.assessments
      : [],
    observations: cleaned.observations,
    strengths: cleaned.strengths,
    weaknesses: cleaned.weaknesses,
    findings: cleaned.findings,
  }
}

function editorBcgPayload(value: UpdateBcgPayload): UpdateBcgPayload {
  const cleaned = cleanBcg(value)
  return {
    products: cleaned.products.length > 0
      ? cleaned.products
      : [emptyBcgProduct()],
    marketGrowthThreshold: cleaned.marketGrowthThreshold > 0 ? cleaned.marketGrowthThreshold : 10,
    relativeMarketShareThreshold: cleaned.relativeMarketShareThreshold > 0 ? cleaned.relativeMarketShareThreshold : 1,
    observations: cleaned.observations,
    strengths: cleaned.strengths,
    weaknesses: cleaned.weaknesses,
    findings: cleaned.findings,
  }
}

function swotPayloadFromContent(value: unknown): UpdateSwotPayload {
  const content = recordValue(value)
  return {
    strengths: swotItemsFromContent(content.strengths),
    opportunities: swotItemsFromContent(content.opportunities),
    weaknesses: swotItemsFromContent(content.weaknesses),
    threats: swotItemsFromContent(content.threats),
  }
}

function pestPayloadFromContent(value: unknown): UpdatePestPayload {
  const content = recordValue(value)
  return {
    responses: recordsFromValue(content.responses)
      .map((response) => ({
        questionNumber: numberFromValue(response.questionNumber),
        score: response.score === null || response.score === undefined ? null : clamp(numberFromValue(response.score), 0, 4),
      }))
      .filter((response) => response.questionNumber >= 1 && response.questionNumber <= 25),
    findings: recordsFromValue(content.findings)
      .map((finding) => ({
        sourceDimension: pestFactorValue(finding.sourceDimension),
        category: finding.category === 'AMENAZA' ? 'AMENAZA' as const : 'OPORTUNIDAD' as const,
        description: textValue(finding.description),
        evidence: textValue(finding.evidence),
        impact: textValue(finding.impact),
        priority: priorityValue(finding.priority),
        selectedForFoda: Boolean(finding.selectedForFoda),
      }))
      .filter((finding) => finding.description),
  }
}

function porterPayloadFromContent(value: unknown): UpdatePorterPayload {
  const content = recordValue(value)
  return {
    responses: recordsFromValue(content.responses)
      .map((response) => ({
        questionNumber: numberFromValue(response.questionNumber),
        score: response.score === null || response.score === undefined ? null : clamp(numberFromValue(response.score), 0, 4),
      }))
      .filter((response) => response.questionNumber >= 1 && response.questionNumber <= 25),
    findings: recordsFromValue(content.findings)
      .map((finding) => ({
        sourceDimension: porterForceValue(finding.sourceDimension),
        category: finding.category === 'AMENAZA' ? 'AMENAZA' as const : 'OPORTUNIDAD' as const,
        description: textValue(finding.description),
        evidence: textValue(finding.evidence),
        impact: textValue(finding.impact),
        priority: priorityValue(finding.priority),
        selectedForFoda: Boolean(finding.selectedForFoda),
      }))
      .filter((finding) => finding.description),
  }
}

function swotItemsFromContent(value: unknown): SwotItemPayload[] {
  return recordsFromValue(value)
    .map((item) => ({
      description: textValue(item.description).trim(),
      priority: priorityValue(item.priority),
    }))
    .filter((item) => item.description)
}

function valueChainPayloadFromContent(value: unknown): UpdateValueChainPayload {
  const content = recordValue(value)
  return {
    supportActivities: activityItemsFromContent(content.supportActivities, 'DESARROLLO_TECNOLOGICO'),
    primaryActivities: activityItemsFromContent(content.primaryActivities, 'OPERACIONES'),
    assessments: assessmentItemsFromContent(content.assessments),
    observations: textValue(content.observations),
    strengths: stringListFromValue(content.strengths),
    weaknesses: stringListFromValue(content.weaknesses),
    findings: valueChainFindingsFromContent(content.findings, content.strengths, content.weaknesses),
  }
}

function activityItemsFromContent(value: unknown, fallback: ValueChainActivity): ValueChainActivityPayload[] {
  return recordsFromValue(value)
    .map((item) => ({
      activity: activityValue(item.activity, fallback),
      description: textValue(item.description).trim(),
      priority: priorityValue(item.priority),
    }))
    .filter((item) => item.description)
}

function assessmentItemsFromContent(value: unknown): ValueChainAssessmentPayload[] {
  return recordsFromValue(value)
    .map((item) => ({
      questionNumber: item.questionNumber === null || item.questionNumber === undefined
        ? null
        : numberFromValue(item.questionNumber),
      activity: activityValue(item.activity, 'OPERACIONES'),
      statement: textValue(item.statement).trim(),
      score: clamp(numberFromValue(item.score), 0, 4),
      notes: textValue(item.notes).trim(),
    }))
    .filter((item) => item.questionNumber !== null || item.statement)
}

function valueChainFindingsFromContent(
  findings: unknown,
  strengths: unknown,
  weaknesses: unknown,
): DiagnosticFindingPayload[] {
  const parsed = recordsFromValue(findings)
    .map((finding) => ({
      sourceDimension: activityValue(finding.sourceDimension, 'OPERACIONES'),
      category: finding.category === 'DEBILIDAD' ? 'DEBILIDAD' as const : 'FORTALEZA' as const,
      description: textValue(finding.description).trim(),
      evidence: textValue(finding.evidence).trim(),
      impact: textValue(finding.impact).trim(),
      priority: priorityValue(finding.priority),
      selectedForFoda: Boolean(finding.selectedForFoda),
    }))
    .filter((finding) => finding.description)
  if (parsed.length > 0) return parsed
  return [
    ...stringListFromValue(strengths).map((description) => ({ ...emptyValueChainFinding('FORTALEZA'), description })),
    ...stringListFromValue(weaknesses).map((description) => ({ ...emptyValueChainFinding('DEBILIDAD'), description })),
  ]
}

function bcgPayloadFromContent(value: unknown): UpdateBcgPayload {
  const content = recordValue(value)
  return {
    products: recordsFromValue(content.products)
      .map((product) => ({
        name: textValue(product.name).trim(),
        description: textValue(product.description).trim(),
        annualSales: Math.max(0, numberFromValue(product.annualSales)),
        marketGrowthRate: numberFromValue(product.marketGrowthRate),
        relativeMarketShare: Math.max(0, numberFromValue(product.relativeMarketShare)),
        marketGrowthRates: numericListFromValue(product.marketGrowthRates, false),
        sectorDemandValues: numericListFromValue(product.sectorDemandValues, true),
        competitors: recordsFromValue(product.competitors)
          .map((competitor) => ({
            name: textValue(competitor.name),
            sales: Math.max(0, numberFromValue(competitor.sales)),
          }))
          .slice(0, BCG_MAX_COMPETITORS),
        notes: textValue(product.notes).trim(),
      }))
      .filter((product) => product.name),
    marketGrowthThreshold: numberFromValue(content.marketGrowthThreshold, 10),
    relativeMarketShareThreshold: numberFromValue(content.relativeMarketShareThreshold, 1),
    observations: textValue(content.observations),
    strengths: stringListFromValue(content.strengths),
    weaknesses: stringListFromValue(content.weaknesses),
    findings: bcgFindingsFromContent(content.findings, content.strengths, content.weaknesses),
  }
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function recordsFromValue(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : []
}

function arrayValue<T>(value: T[] | readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : []
}

function textValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function normalizeTextKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function stringListFromValue(value: unknown) {
  return Array.isArray(value) ? value.map(textValue).map((item) => item.trim()).filter(Boolean) : []
}

function priorityValue(value: unknown): DiagnosticPriority {
  return priorities.includes(value as DiagnosticPriority) ? value as DiagnosticPriority : 'MEDIA'
}

function activityValue(value: unknown, fallback: ValueChainActivity): ValueChainActivity {
  return allActivities.includes(value as ValueChainActivity) ? value as ValueChainActivity : fallback
}

function pestFactorValue(value: unknown) {
  const factors = ['SOCIAL_DEMOGRAPHIC', 'ENVIRONMENTAL', 'POLITICAL', 'ECONOMIC', 'TECHNOLOGICAL'] as const
  return factors.includes(value as typeof factors[number]) ? value as typeof factors[number] : 'SOCIAL_DEMOGRAPHIC'
}

function porterForceValue(value: unknown) {
  const forces = ['INDUSTRY_RIVALRY', 'NEW_ENTRANTS', 'BUYER_POWER', 'SUPPLIER_POWER', 'SUBSTITUTES'] as const
  return forces.includes(value as typeof forces[number]) ? value as typeof forces[number] : 'INDUSTRY_RIVALRY'
}

function numberFromValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function contentHasTool(content: unknown, tool: DiagnosticToolKey) {
  const source = recordValue(content)
  if (tool === 'pest') return Boolean(source.pest)
  if (tool === 'porter') return Boolean(source.porter)
  if (tool === 'foda') return Boolean(source.swot)
  if (tool === 'valueChain') return Boolean(source.valueChain)
  return Boolean(source.bcg)
}

function swotCount(summary: SwotSummary | null) {
  if (!summary) return 0
  return arrayValue(summary.strengths).length
    + arrayValue(summary.opportunities).length
    + arrayValue(summary.weaknesses).length
    + arrayValue(summary.threats).length
}

function activeUpdatedAt(
  activeTool: DiagnosticToolKey,
  pest: PestSummary | null,
  porter: PorterSummary | null,
  swot: SwotSummary | null,
  valueChain: ValueChainSummary | null,
  bcg: BcgSummary | null,
) {
  if (activeTool === 'pest') return pest?.updatedAt
  if (activeTool === 'porter') return porter?.updatedAt
  if (activeTool === 'foda') return swot?.updatedAt
  if (activeTool === 'valueChain') return valueChain?.updatedAt
  return bcg?.updatedAt
}

function activePhaseTitle(plan: PlanSummary) {
  return arrayValue(plan.phases).find((phase) => phase.phase === plan.activePhase)?.title ?? '-'
}

function cleanLines(values: string[]) {
  return arrayValue(values).map((value) => value.trim()).filter(Boolean)
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
