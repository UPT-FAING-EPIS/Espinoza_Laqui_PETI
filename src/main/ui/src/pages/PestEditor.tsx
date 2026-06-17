import { BarChart3 } from 'lucide-react'
import type {
  PestFactor,
  PestSummary,
  UpdatePestPayload,
} from '../types'
import { AssessmentToolEditor } from './AssessmentToolEditor'
import { DiagnosticFindingsEditor } from './DiagnosticFindingsEditor'

const factorOrder: PestFactor[] = [
  'SOCIAL_DEMOGRAPHIC',
  'ENVIRONMENTAL',
  'POLITICAL',
  'ECONOMIC',
  'TECHNOLOGICAL',
]

const factorLabels: Record<PestFactor, string> = {
  SOCIAL_DEMOGRAPHIC: 'Sociales y demograficos',
  ENVIRONMENTAL: 'Medioambientales',
  POLITICAL: 'Politicos',
  ECONOMIC: 'Economicos',
  TECHNOLOGICAL: 'Tecnologicos',
}

const scoreLabels = [
  'En total desacuerdo',
  'No esta de acuerdo',
  'Esta de acuerdo',
  'Esta bastante de acuerdo',
  'En total acuerdo',
]

export function PestEditor({
  onChange,
  summary,
  value,
}: {
  onChange: (value: UpdatePestPayload) => void
  summary: PestSummary | null
  value: UpdatePestPayload
}) {
  const current = pestFormValue(value)
  const questions = arrayValue(summary?.questions).map((question) => ({
    questionNumber: question.questionNumber,
    dimension: question.factor,
    statement: question.statement,
  }))
  const factorScores = pestFactorScores(current)

  return (
    <AssessmentToolEditor
      chart={<PestImpactChart scores={factorScores} />}
      dimensions={questionnaireOrder().map((factor) => ({ value: factor, label: factorLabels[factor], questionCount: 5 }))}
      questions={questions}
      responses={current.responses}
      scaleAriaLabel={(questionNumber) => `Valoracion de pregunta ${questionNumber}`}
      scoreLabels={scoreLabels}
      title="Autodiagnostico del macroentorno"
      onResponsesChange={(responses) => onChange({ ...current, responses })}
    >
      <DiagnosticFindingsEditor
        categories={[
          { category: 'OPORTUNIDAD', buttonLabel: 'Oportunidad', defaultDimension: 'SOCIAL_DEMOGRAPHIC' },
          { category: 'AMENAZA', buttonLabel: 'Amenaza', defaultDimension: 'SOCIAL_DEMOGRAPHIC' },
        ]}
        copy="Registre las oportunidades y amenazas relevantes. Puede crear todas las que necesite."
        descriptionPlaceholder="Explique la oportunidad o amenaza identificada"
        dimensionLabel="Factor de origen"
        dimensionOptions={factorOrder.map((factor) => ({ value: factor, label: factorLabels[factor] }))}
        emptyMessage="Todavia no se registraron oportunidades o amenazas PEST."
        findings={current.findings}
        title="Hallazgos del analisis externo"
        onChange={(findings) => onChange({ ...current, findings })}
      />
    </AssessmentToolEditor>
  )
}

function PestImpactChart({ scores }: { scores: Record<PestFactor, PestFactorScore> }) {
  return (
    <section className="diag-chart-card wide diag-pest-chart-card">
      <div className="diag-chart-head">
        <div>
          <span>Grafico PEST</span>
          <h3>Nivel de impacto de factores generales externos</h3>
        </div>
        <strong>Umbral notable: 0.70</strong>
      </div>
      <div className="diag-pest-chart">
        <div className="diag-pest-y-axis">
          {[1, 0.8, 0.6, 0.4, 0.2, 0].map((value) => <span key={value}>{value.toFixed(1)}</span>)}
        </div>
        <div className="diag-pest-plot">
          <div className="diag-pest-threshold" />
          {factorOrder.map((factor) => {
            const score = scores[factor]
            return (
              <div className="diag-pest-bar-column" key={factor}>
                <div className="diag-pest-bar-track">
                  <div
                    className={`diag-pest-bar ${score.level >= 0.7 ? 'notable' : ''}`}
                    style={{ height: `${score.level * 100}%` }}
                    title={`${factorLabels[factor]}: ${score.level.toFixed(2)} (${score.score}/20)`}
                  />
                </div>
                <strong>{score.level.toFixed(2)}</strong>
                <span>{factorLabels[factor]}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="diag-pest-axis-title">
        <BarChart3 size={15} />
        Tipologia de factores generales externos
      </div>
    </section>
  )
}

type PestFactorScore = {
  answered: number
  score: number
  level: number
}

export function pestFactorScores(value: UpdatePestPayload): Record<PestFactor, PestFactorScore> {
  const result = Object.fromEntries(
    factorOrder.map((factor) => [factor, { answered: 0, score: 0, level: 0 }]),
  ) as Record<PestFactor, PestFactorScore>
  for (const response of arrayValue(value.responses)) {
    if (response.score === null) continue
    const factor = factorForQuestion(response.questionNumber)
    result[factor].answered += 1
    result[factor].score += response.score
  }
  for (const factor of factorOrder) {
    result[factor].level = Math.round((result[factor].score / 20) * 100) / 100
  }
  return result
}

function questionnaireOrder(): PestFactor[] {
  return ['SOCIAL_DEMOGRAPHIC', 'POLITICAL', 'ECONOMIC', 'TECHNOLOGICAL', 'ENVIRONMENTAL']
}

function factorForQuestion(questionNumber: number): PestFactor {
  if (questionNumber <= 5) return 'SOCIAL_DEMOGRAPHIC'
  if (questionNumber <= 10) return 'POLITICAL'
  if (questionNumber <= 15) return 'ECONOMIC'
  if (questionNumber <= 20) return 'TECHNOLOGICAL'
  return 'ENVIRONMENTAL'
}

function pestFormValue(value: UpdatePestPayload): UpdatePestPayload {
  return {
    responses: arrayValue(value?.responses),
    findings: arrayValue(value?.findings),
  }
}

function arrayValue<T>(value: T[] | readonly T[] | null | undefined): T[] {
  return Array.isArray(value) ? [...value] : []
}
