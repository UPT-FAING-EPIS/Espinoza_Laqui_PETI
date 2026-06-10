import { BarChart3, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import type {
  DiagnosticFindingPayload,
  DiagnosticPriority,
  PestFactor,
  PestSummary,
  UpdatePestPayload,
} from '../types'

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

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']

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
  const questions = arrayValue(summary?.questions)
  const factorScores = pestFactorScores(current)

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
    onChange({
      ...current,
      findings: [...current.findings, emptyFinding(category)],
    })
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
    <div className="diag-pest-layout">
      <PestImpactChart scores={factorScores} />

      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>Autodiagnostico del macroentorno</h3>
            <p className="diag-panel-copy">
              Valore las 25 afirmaciones. El nivel de impacto orienta el analisis, pero la clasificacion final
              como oportunidad o amenaza depende de su efecto sobre la organizacion.
            </p>
          </div>
          <span className="diag-pest-progress">{answeredCount(current)}/25 respondidas</span>
        </div>

        <div className="diag-pest-questionnaire">
          {questionnaireOrder().map((factor) => (
            <article className="diag-pest-factor" key={factor}>
              <header>
                <strong>{factorLabels[factor]}</strong>
                <span>{factorScores[factor].answered}/5</span>
              </header>
              <div className="diag-pest-questions">
                {questions.filter((question) => question.factor === factor).map((question) => {
                  const selected = responseScore(current, question.questionNumber)
                  return (
                    <div className="diag-pest-question" key={question.questionNumber}>
                      <div className="diag-pest-question-copy">
                        <span>{question.questionNumber}</span>
                        <p>{question.statement}</p>
                      </div>
                      <div className="diag-pest-scale" role="group" aria-label={`Valoracion de pregunta ${question.questionNumber}`}>
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
            <h3>Hallazgos del analisis externo</h3>
            <p className="diag-panel-copy">
              Registre las oportunidades y amenazas relevantes. Puede crear todas las que necesite.
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
          <p className="gplan-muted">Todavia no se registraron oportunidades o amenazas PEST.</p>
        )}
        <div className="diag-pest-findings">
          {current.findings.map((finding, index) => (
            <article className="diag-pest-finding" key={index}>
              <div className="diag-pest-finding-head">
                <span className={`diag-pest-kind ${finding.category.toLowerCase()}`}>{finding.category}</span>
                <button
                  className="gplan-remove-btn"
                  title="Eliminar hallazgo"
                  type="button"
                  onClick={() => removeFinding(index)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="diag-pest-finding-grid">
                <label>
                  <span>Factor de origen</span>
                  <select
                    value={finding.sourceDimension}
                    onChange={(event) => updateFinding(index, { sourceDimension: event.target.value as PestFactor })}
                  >
                    {factorOrder.map((factor) => (
                      <option key={factor} value={factor}>{factorLabels[factor]}</option>
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
                    placeholder="Explique la oportunidad o amenaza identificada"
                  />
                </label>
                <label>
                  <span>Evidencia</span>
                  <textarea
                    rows={2}
                    value={finding.evidence}
                    onChange={(event) => updateFinding(index, { evidence: event.target.value })}
                    placeholder="Dato, fuente o resultado que la sustenta"
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

function responseScore(value: UpdatePestPayload, questionNumber: number) {
  return arrayValue(value.responses).find((response) => response.questionNumber === questionNumber)?.score ?? null
}

function answeredCount(value: UpdatePestPayload) {
  return arrayValue(value.responses).filter((response) => response.score !== null).length
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

function emptyFinding(category: 'OPORTUNIDAD' | 'AMENAZA'): DiagnosticFindingPayload {
  return {
    sourceDimension: 'SOCIAL_DEMOGRAPHIC',
    category,
    description: '',
    evidence: '',
    impact: '',
    priority: 'MEDIA',
    selectedForFoda: true,
  }
}
