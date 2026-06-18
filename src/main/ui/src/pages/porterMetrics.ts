import type { PorterForce, UpdatePorterPayload } from '../types'
import { arrayValue } from '../utils/normalizers'

const forceOrder: PorterForce[] = [
  'INDUSTRY_RIVALRY',
  'NEW_ENTRANTS',
  'BUYER_POWER',
  'SUPPLIER_POWER',
  'SUBSTITUTES',
]

export type PorterForceScore = {
  answered: number
  score: number
  level: number
}

export function porterForceScores(value: UpdatePorterPayload): Record<PorterForce, PorterForceScore> {
  const result = Object.fromEntries(
    forceOrder.map((force) => [force, { answered: 0, score: 0, level: 0 }]),
  ) as Record<PorterForce, PorterForceScore>
  for (const response of arrayValue(value.responses)) {
    if (response.score === null) continue
    const force = forceForQuestion(response.questionNumber)
    result[force].answered += 1
    result[force].score += response.score
  }
  for (const force of forceOrder) {
    result[force].level = Math.round((result[force].score / 20) * 100) / 100
  }
  return result
}

export function porterOverallPressure(value: UpdatePorterPayload) {
  const score = arrayValue(value.responses).reduce((total, response) => total + (response.score ?? 0), 0)
  return Math.round(score)
}

function forceForQuestion(questionNumber: number): PorterForce {
  if (questionNumber <= 5) return 'INDUSTRY_RIVALRY'
  if (questionNumber <= 10) return 'NEW_ENTRANTS'
  if (questionNumber <= 15) return 'BUYER_POWER'
  if (questionNumber <= 20) return 'SUPPLIER_POWER'
  return 'SUBSTITUTES'
}
