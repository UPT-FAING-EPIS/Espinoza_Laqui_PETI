import { CheckCircle2, Plus, Radar, Trash2 } from 'lucide-react'
import type {
  DiagnosticFindingPayload,
  DiagnosticPriority,
  PorterForce,
  PorterSummary,
  UpdatePorterPayload,
} from '../types'
import { porterForceScores, porterOverallPressure } from './porterMetrics'
import type { PorterForceScore } from './porterMetrics'

const forceOrder: PorterForce[] = [
  'INDUSTRY_RIVALRY',
  'NEW_ENTRANTS',
  'BUYER_POWER',
  'SUPPLIER_POWER',
  'SUBSTITUTES',
]

const forceLabels: Record<PorterForce, string> = {
  INDUSTRY_RIVALRY: 'Rivalidad entre competidores',
  NEW_ENTRANTS: 'Nuevos entrantes',
  BUYER_POWER: 'Poder de clientes',
  SUPPLIER_POWER: 'Poder de proveedores',
  SUBSTITUTES: 'Productos sustitutos',
}

const scoreLabels = [
  'Presion muy baja',
  'Presion baja',
  'Presion media',
  'Presion alta',
  'Presion muy alta',
]

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']

export function PorterEditor({
  onChange,
  summary,
  value,
}: {
  onChange: (value: UpdatePorterPayload) => void
  summary: PorterSummary | null
  value: UpdatePorterPayload
}) {
  const current = porterFormValue(value)
  const questions = arrayValue(summary?.questions)
  const forceScores = porterForceScores(current)
  const pressure = porterOverallPressure(current)

  function updateResponse(questionNumber: number, score: number) {
    const exists = current.responses.some((response) => response.questionNumber === questionNumber)
    onChange({
      ...current,
      responses: exists
        ? current.responses.map((response) => response.questionNumber === questionNumber ? { ...response, score } : response)
        : [...current.responses, { questionNumber, score }].sort((a, b) => a.questionNumber - b.questionNumber),
    })
  }

  function addFinding(category: 'OPORTUNIDAD' | 'AMENAZA') {
    onChange({ ...current, findings: [...current.findings, emptyFinding(category)] })
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
    <div className="diag-pest-layout">
      <PorterRadarChart scores={forceScores} pressure={pressure} complete={current.responses.length === 25} />

      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Autodiagnostico competitivo</h3>
            <p className="diag-panel-copy">
              Todas las afirmaciones usan la misma escala: una puntuacion mayor representa mayor presion competitiva.
            </p>
          </div>
          <span className="diag-pest-progress">{answeredCount(current)}/25 respondidas</span>
        </div>

        <div className="diag-pest-questionnaire">
          {forceOrder.map((force) => (
            <article className="diag-pest-factor" key={force}>
              <header>
                <strong>{forceLabels[force]}</strong>
                <span>{forceScores[force].answered}/5</span>
              </header>
              <div className="diag-pest-questions">
                {questions.filter((question) => question.force === force).map((question) => {
                  const selected = responseScore(current, question.questionNumber)
                  return (
                    <div className="diag-pest-question" key={question.questionNumber}>
                      <div className="diag-pest-question-copy">
                        <span>{question.questionNumber}</span>
                        <p>{question.statement}</p>
                      </div>
                      <div className="diag-pest-scale" role="group" aria-label={`Presion de pregunta ${question.questionNumber}`}>
                        {scoreLabels.map((label, score) => (
                          <button
                            aria-label={`${score}: ${label}`}
                            aria-pressed={selected === score}
                            className={selected === score ? 'active' : ''}
                            key={score}
                            title={label}
                            type="button"
                            onClick={() => updateResponse(question.questionNumber, score)}
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
          ))}
        </div>
      </section>

      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Hallazgos del microentorno</h3>
            <p className="diag-panel-copy">
              Registre oportunidades y amenazas sustentadas en las fuerzas evaluadas.
            </p>
          </div>
          <div className="diag-pest-finding-actions">
            <button className="gplan-inline-btn" type="button" onClick={() => addFinding('OPORTUNIDAD')}>
              <Plus size={14} />
              Oportunidad
            </button>
            <button className="gplan-inline-btn" type="button" onClick={() => addFinding('AMENAZA')}>
              <Plus size={14} />
              Amenaza
            </button>
          </div>
        </div>

        {current.findings.length === 0 && (
          <p className="gplan-muted">Todavia no se registraron oportunidades o amenazas Porter.</p>
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
                  <span>Fuerza de origen</span>
                  <select
                    value={finding.sourceDimension}
                    onChange={(event) => updateFinding(index, { sourceDimension: event.target.value as PorterForce })}
                  >
                    {forceOrder.map((force) => <option key={force} value={force}>{forceLabels[force]}</option>)}
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
                    placeholder="Explique la oportunidad o amenaza identificada"
                  />
                </label>
                <label>
                  <span>Evidencia</span>
                  <textarea
                    rows={2}
                    value={finding.evidence}
                    onChange={(event) => updateFinding(index, { evidence: event.target.value })}
                    placeholder="Dato o resultado que sustenta el hallazgo"
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

function PorterRadarChart({
  complete,
  pressure,
  scores,
}: {
  complete: boolean
  pressure: number
  scores: Record<PorterForce, PorterForceScore>
}) {
  const center = 210
  const radius = 128
  const points = forceOrder.map((force, index) => radarPoint(center, radius * scores[force].level, index))
  const axisPoints = forceOrder.map((_, index) => radarPoint(center, radius, index))

  return (
    <section className="diag-chart-card wide diag-porter-chart-card">
      <div className="diag-chart-head">
        <div>
          <span>Grafico Porter</span>
          <h3>Presion competitiva por fuerza</h3>
        </div>
        <strong>{complete ? `${pressure}% presion global` : `${answeredCountFromScores(scores)}/25 respondidas`}</strong>
      </div>
      <div className="diag-porter-chart-layout">
        <svg className="diag-porter-radar" viewBox="0 0 420 420" role="img" aria-label="Radar de las cinco fuerzas de Porter">
          {[0.25, 0.5, 0.75, 1].map((level) => (
            <polygon
              className="diag-porter-grid"
              key={level}
              points={axisPoints.map((_, index) => pointString(radarPoint(center, radius * level, index))).join(' ')}
            />
          ))}
          {axisPoints.map((point, index) => (
            <line className="diag-porter-axis" key={forceOrder[index]} x1={center} y1={center} x2={point.x} y2={point.y} />
          ))}
          <polygon className="diag-porter-area" points={points.map(pointString).join(' ')} />
          {points.map((point, index) => (
            <circle className="diag-porter-point" cx={point.x} cy={point.y} key={forceOrder[index]} r="4" />
          ))}
          {axisPoints.map((_, index) => {
            const label = radarPoint(center, radius + 42, index)
            return (
              <text className="diag-porter-label" key={forceOrder[index]} textAnchor="middle" x={label.x} y={label.y}>
                {shortForceLabel(forceOrder[index])}
              </text>
            )
          })}
        </svg>
        <div className="diag-porter-summary">
          <div className="diag-porter-pressure">
            <Radar size={18} />
            <span>Presion global</span>
            <strong>{pressure}%</strong>
          </div>
          <p>{porterConclusion(pressure, complete)}</p>
          <div className="diag-porter-force-list">
            {forceOrder.map((force) => (
              <div key={force}>
                <span>{forceLabels[force]}</span>
                <strong>{scores[force].score}/20</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function porterConclusion(pressure: number, complete: boolean) {
  if (!complete) return 'Complete las 25 preguntas para obtener una conclusion competitiva.'
  if (pressure < 25) return 'La presion competitiva del sector es baja y el entorno resulta favorable.'
  if (pressure < 50) return 'La presion competitiva del sector es moderada y requiere seguimiento.'
  if (pressure < 75) return 'La presion competitiva del sector es alta y exige respuestas estrategicas.'
  return 'La presion competitiva del sector es muy alta y limita significativamente su atractivo.'
}

function radarPoint(center: number, radius: number, index: number) {
  const angle = (-Math.PI / 2) + (index * 2 * Math.PI / forceOrder.length)
  return { x: center + Math.cos(angle) * radius, y: center + Math.sin(angle) * radius }
}

function pointString(point: { x: number; y: number }) {
  return `${point.x},${point.y}`
}

function shortForceLabel(force: PorterForce) {
  if (force === 'INDUSTRY_RIVALRY') return 'Rivalidad'
  if (force === 'NEW_ENTRANTS') return 'Entrantes'
  if (force === 'BUYER_POWER') return 'Clientes'
  if (force === 'SUPPLIER_POWER') return 'Proveedores'
  return 'Sustitutos'
}

function responseScore(value: UpdatePorterPayload, questionNumber: number) {
  return arrayValue(value.responses).find((response) => response.questionNumber === questionNumber)?.score ?? null
}

function answeredCount(value: UpdatePorterPayload) {
  return arrayValue(value.responses).filter((response) => response.score !== null).length
}

function answeredCountFromScores(scores: Record<PorterForce, PorterForceScore>) {
  return forceOrder.reduce((total, force) => total + scores[force].answered, 0)
}

function emptyFinding(category: 'OPORTUNIDAD' | 'AMENAZA'): DiagnosticFindingPayload {
  return {
    sourceDimension: 'INDUSTRY_RIVALRY',
    category,
    description: '',
    evidence: '',
    impact: '',
    priority: 'MEDIA',
    selectedForFoda: true,
  }
}

function porterFormValue(value: UpdatePorterPayload): UpdatePorterPayload {
  return {
    responses: arrayValue(value?.responses),
    findings: arrayValue(value?.findings),
  }
}

function arrayValue<T>(value: T[] | readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : []
}
