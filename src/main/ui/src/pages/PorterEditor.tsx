import { Radar } from 'lucide-react'
import type {
  PorterForce,
  PorterSummary,
  UpdatePorterPayload,
} from '../types'
import { AssessmentToolEditor } from './AssessmentToolEditor'
import { DiagnosticFindingsEditor } from './DiagnosticFindingsEditor'
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
  const questions = arrayValue(summary?.questions).map((question) => ({
    questionNumber: question.questionNumber,
    dimension: question.force,
    statement: question.statement,
  }))
  const forceScores = porterForceScores(current)
  const pressure = porterOverallPressure(current)

  return (
    <AssessmentToolEditor
      chart={<PorterRadarChart scores={forceScores} pressure={pressure} complete={current.responses.length === 25} />}
      dimensions={forceOrder.map((force) => ({ value: force, label: forceLabels[force], questionCount: 5 }))}
      questions={questions}
      responses={current.responses}
      scaleAriaLabel={(questionNumber) => `Presion de pregunta ${questionNumber}`}
      scoreLabels={scoreLabels}
      title="Autodiagnostico competitivo"
      onResponsesChange={(responses) => onChange({ ...current, responses })}
    >
      <DiagnosticFindingsEditor
        categories={[
          { category: 'OPORTUNIDAD', buttonLabel: 'Oportunidad', defaultDimension: 'INDUSTRY_RIVALRY' },
          { category: 'AMENAZA', buttonLabel: 'Amenaza', defaultDimension: 'INDUSTRY_RIVALRY' },
        ]}
        copy="Registre oportunidades y amenazas sustentadas en las fuerzas evaluadas."
        descriptionPlaceholder="Explique la oportunidad o amenaza identificada"
        dimensionLabel="Fuerza de origen"
        dimensionOptions={forceOrder.map((force) => ({ value: force, label: forceLabels[force] }))}
        emptyMessage="Todavia no se registraron oportunidades o amenazas Porter."
        findings={current.findings}
        title="Hallazgos del microentorno"
        onChange={(findings) => onChange({ ...current, findings })}
      />
    </AssessmentToolEditor>
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

function answeredCountFromScores(scores: Record<PorterForce, PorterForceScore>) {
  return forceOrder.reduce((total, force) => total + scores[force].answered, 0)
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
