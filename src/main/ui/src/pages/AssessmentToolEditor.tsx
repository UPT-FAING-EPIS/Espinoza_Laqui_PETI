import type { ReactNode } from 'react'

export type AssessmentQuestion = {
  questionNumber: number
  dimension: string
  statement: string
}

export type AssessmentResponse = {
  questionNumber: number
  score: number | null
}

type AssessmentDimension = {
  label: string
  questionCount?: number
  value: string
}

export function AssessmentToolEditor({
  chart,
  children,
  dimensions,
  onResponsesChange,
  progressTotal = 25,
  questions,
  responses,
  scaleAriaLabel,
  scoreLabels,
  title,
}: {
  chart: ReactNode
  children: ReactNode
  dimensions: AssessmentDimension[]
  onResponsesChange: (responses: AssessmentResponse[]) => void
  progressTotal?: number
  questions: AssessmentQuestion[]
  responses: AssessmentResponse[]
  scaleAriaLabel: (questionNumber: number) => string
  scoreLabels: string[]
  title: string
}) {
  function updateResponse(questionNumber: number, score: number) {
    const exists = responses.some((response) => response.questionNumber === questionNumber)
    onResponsesChange(
      exists
        ? responses.map((response) => response.questionNumber === questionNumber ? { ...response, score } : response)
        : [...responses, { questionNumber, score }].sort((a, b) => a.questionNumber - b.questionNumber),
    )
  }

  return (
    <div className="diag-pest-layout">
      {chart}

      <section className="diag-panel wide">
        <div className="diag-panel-head">
          <div>
            <h3>{title}</h3>
          </div>
          <span className="diag-pest-progress">{answeredCount(responses)}/{progressTotal} respondidas</span>
        </div>

        <div className="diag-pest-questionnaire">
          {dimensions.map((dimension) => {
            const dimensionQuestions = questions.filter((question) => question.dimension === dimension.value)
            const questionCount = dimension.questionCount ?? dimensionQuestions.length
            return (
              <article className="diag-pest-factor" key={dimension.value}>
                <header>
                  <strong>{dimension.label}</strong>
                  <span>{answeredCountForQuestions(responses, dimensionQuestions)}/{questionCount}</span>
                </header>
                <div className="diag-pest-questions">
                  {dimensionQuestions.map((question) => {
                    const selected = responseScore(responses, question.questionNumber)
                    return (
                      <div className="diag-pest-question" key={question.questionNumber}>
                        <div className="diag-pest-question-copy">
                          <span>{question.questionNumber}</span>
                          <p>{question.statement}</p>
                        </div>
                        <div className="diag-pest-scale" role="group" aria-label={scaleAriaLabel(question.questionNumber)}>
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
            )
          })}
        </div>
      </section>

      {children}
    </div>
  )
}

function responseScore(responses: AssessmentResponse[], questionNumber: number) {
  return responses.find((response) => response.questionNumber === questionNumber)?.score ?? null
}

function answeredCount(responses: AssessmentResponse[]) {
  return responses.filter((response) => response.score !== null).length
}

function answeredCountForQuestions(responses: AssessmentResponse[], questions: AssessmentQuestion[]) {
  const questionNumbers = new Set(questions.map((question) => question.questionNumber))
  return responses.filter((response) => response.score !== null && questionNumbers.has(response.questionNumber)).length
}
