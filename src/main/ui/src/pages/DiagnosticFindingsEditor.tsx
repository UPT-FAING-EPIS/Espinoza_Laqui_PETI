import { Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DiagnosticFindingPayload, DiagnosticPriority, SwotCategory } from '../types'

type FindingCategory = Extract<SwotCategory, 'FORTALEZA' | 'OPORTUNIDAD' | 'DEBILIDAD' | 'AMENAZA'>

type FindingCategoryConfig = {
  buttonLabel: string
  category: FindingCategory
  defaultDimension: string
  emptyMessage?: string
  title?: string
}

type DimensionOption = {
  label: string
  value: string
}

const priorities: DiagnosticPriority[] = ['BAJA', 'MEDIA', 'ALTA']

export function DiagnosticFindingsEditor({
  children,
  copy,
  descriptionPlaceholder,
  dimensionLabel,
  dimensionOptions,
  emptyMessage,
  findings,
  grouped = false,
  onChange,
  title,
  categories,
}: {
  categories: FindingCategoryConfig[]
  children?: ReactNode
  copy: string
  descriptionPlaceholder: string
  dimensionLabel: string
  dimensionOptions: DimensionOption[]
  emptyMessage?: string
  findings: DiagnosticFindingPayload[]
  grouped?: boolean
  onChange: (findings: DiagnosticFindingPayload[]) => void
  title: string
}) {
  function addFinding(category: FindingCategoryConfig) {
    onChange([...findings, emptyFinding(category)])
  }

  function updateFinding(index: number, patch: Partial<DiagnosticFindingPayload>) {
    onChange(findings.map((finding, itemIndex) => itemIndex === index ? { ...finding, ...patch } : finding))
  }

  function removeFinding(index: number) {
    onChange(findings.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <section className="diag-panel wide">
      <div className="diag-panel-head">
        <div>
          <h3>{title}</h3>
          <p className="diag-panel-copy">{copy}</p>
        </div>
        <div className="diag-pest-finding-actions">
          {categories.map((category) => (
            <button className="gplan-inline-btn" key={category.category} type="button" onClick={() => addFinding(category)}>
              <Plus size={14} />
              {category.buttonLabel}
            </button>
          ))}
        </div>
      </div>

      {grouped ? (
        <div className="diag-bcg-synthesis">
          {children}
          <div className="diag-bcg-finding-columns">
            {categories.map((category) => (
              <FindingGroup
                category={category}
                dimensionLabel={dimensionLabel}
                dimensionOptions={dimensionOptions}
                entries={findings.map((finding, index) => ({ finding, index })).filter(({ finding }) => finding.category === category.category)}
                key={category.category}
                descriptionPlaceholder={descriptionPlaceholder}
                onRemove={removeFinding}
                onUpdate={updateFinding}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {children}
          {findings.length === 0 && emptyMessage && <p className="gplan-muted">{emptyMessage}</p>}
          <div className="diag-pest-findings">
            {findings.map((finding, index) => (
              <FindingCard
                dimensionLabel={dimensionLabel}
                dimensionOptions={dimensionOptions}
                finding={finding}
                index={index}
                key={index}
                descriptionPlaceholder={descriptionPlaceholder}
                onRemove={removeFinding}
                onUpdate={updateFinding}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function FindingGroup({
  category,
  dimensionLabel,
  dimensionOptions,
  entries,
  onRemove,
  onUpdate,
  descriptionPlaceholder,
}: {
  category: FindingCategoryConfig
  descriptionPlaceholder: string
  dimensionLabel: string
  dimensionOptions: DimensionOption[]
  entries: Array<{ finding: DiagnosticFindingPayload; index: number }>
  onRemove: (index: number) => void
  onUpdate: (index: number, patch: Partial<DiagnosticFindingPayload>) => void
}) {
  return (
    <section className="diag-bcg-finding-group">
      <div className="diag-bcg-finding-group-head">
        <div className="diag-bcg-finding-group-title">
          <span className={`diag-pest-kind ${category.category.toLowerCase()}`}>{category.title ?? category.category}</span>
          <small>{entries.length} registradas</small>
        </div>
      </div>
      {entries.length === 0 && category.emptyMessage && <p className="gplan-muted">{category.emptyMessage}</p>}
      <div className="diag-pest-findings">
        {entries.map(({ finding, index }) => (
          <FindingCard
            dimensionLabel={dimensionLabel}
            dimensionOptions={dimensionOptions}
            finding={finding}
            index={index}
            key={index}
            descriptionPlaceholder={descriptionPlaceholder}
            onRemove={onRemove}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </section>
  )
}

function FindingCard({
  descriptionPlaceholder,
  dimensionLabel,
  dimensionOptions,
  finding,
  index,
  onRemove,
  onUpdate,
}: {
  descriptionPlaceholder: string
  dimensionLabel: string
  dimensionOptions: DimensionOption[]
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
          <span>{dimensionLabel}</span>
          <select value={finding.sourceDimension} onChange={(event) => onUpdate(index, { sourceDimension: event.target.value })}>
            {dimensionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Prioridad</span>
          <select value={finding.priority} onChange={(event) => onUpdate(index, { priority: event.target.value as DiagnosticPriority })}>
            {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="wide">
          <span>Descripcion</span>
          <textarea
            rows={2}
            value={finding.description}
            placeholder={descriptionPlaceholder}
            onChange={(event) => onUpdate(index, { description: event.target.value })}
          />
        </label>
      </div>
    </article>
  )
}

function emptyFinding(category: FindingCategoryConfig): DiagnosticFindingPayload {
  return {
    sourceDimension: category.defaultDimension,
    category: category.category,
    description: '',
    evidence: '',
    impact: '',
    priority: 'MEDIA',
    selectedForFoda: true,
  }
}
