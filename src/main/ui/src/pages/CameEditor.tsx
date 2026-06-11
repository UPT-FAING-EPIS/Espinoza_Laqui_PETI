import { Plus, Save, Trash2, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getGroupPlanCame, saveGroupPlanCame } from '../api/planApi'
import type { CameActionPayload, CameQuadrant, CameSummary, DiagnosticPriority, UpdateCamePayload } from '../types'
import './DiagnosticsWorkspace.css'
import './CameEditor.css'

const QUADRANTS: { key: CameQuadrant; label: string; description: string; color: string }[] = [
  { key: 'CORREGIR', label: 'Corregir', description: 'Acciones para corregir debilidades', color: '#ef4444' },
  { key: 'AFRONTAR', label: 'Afrontar', description: 'Acciones para afrontar amenazas', color: '#f59e0b' },
  { key: 'MANTENER', label: 'Mantener', description: 'Acciones para mantener fortalezas', color: '#22c55e' },
  { key: 'EXPLOTAR', label: 'Explotar', description: 'Acciones para explotar oportunidades', color: '#3b82f6' },
]

const PRIORITY_LABELS: Record<DiagnosticPriority, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
}

const PRIORITY_COLORS: Record<DiagnosticPriority, string> = {
  BAJA: '#22c55e',
  MEDIA: '#f59e0b',
  ALTA: '#ef4444',
}

type QuadrantForm = CameActionPayload[]

function emptyAction(): CameActionPayload {
  return { description: '', relatedFactor: '', priority: 'MEDIA' }
}

export default function CameEditor({ groupId }: { groupId: number }) {
  const [summary, setSummary] = useState<CameSummary | null>(null)
  const [corregir, setCorregir] = useState<QuadrantForm>([emptyAction()])
  const [afrontar, setAfrontar] = useState<QuadrantForm>([emptyAction()])
  const [mantener, setMantener] = useState<QuadrantForm>([emptyAction()])
  const [explotar, setExplotar] = useState<QuadrantForm>([emptyAction()])
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setters: Record<CameQuadrant, React.Dispatch<React.SetStateAction<QuadrantForm>>> = {
    CORREGIR: setCorregir,
    AFRONTAR: setAfrontar,
    MANTENER: setMantener,
    EXPLOTAR: setExplotar,
  }

  const values: Record<CameQuadrant, QuadrantForm> = {
    CORREGIR: corregir,
    AFRONTAR: afrontar,
    MANTENER: mantener,
    EXPLOTAR: explotar,
  }

  const load = useCallback(async () => {
    try {
      const d = await getGroupPlanCame(groupId)
      setSummary(d)
      if (d.corregir.length > 0) setCorregir(d.corregir.map(a => ({ description: a.description, relatedFactor: a.relatedFactor, priority: a.priority })))
      if (d.afrontar.length > 0) setAfrontar(d.afrontar.map(a => ({ description: a.description, relatedFactor: a.relatedFactor, priority: a.priority })))
      if (d.mantener.length > 0) setMantener(d.mantener.map(a => ({ description: a.description, relatedFactor: a.relatedFactor, priority: a.priority })))
      if (d.explotar.length > 0) setExplotar(d.explotar.map(a => ({ description: a.description, relatedFactor: a.relatedFactor, priority: a.priority })))
    } catch { /* sin datos aún */ }
  }, [groupId])

  useEffect(() => { load() }, [load])

  function updateAction(quadrant: CameQuadrant, index: number, field: keyof CameActionPayload, value: string) {
    setters[quadrant](prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  function addAction(quadrant: CameQuadrant) {
    setters[quadrant](prev => [...prev, emptyAction()])
  }

  function removeAction(quadrant: CameQuadrant, index: number) {
    setters[quadrant](prev => {
      const next = prev.filter((_, i) => i !== index)
      return next.length > 0 ? next : [emptyAction()]
    })
  }

  async function handleSave() {
    setSaving(true); setError(null); setNotice(null)
    try {
      const payload: UpdateCamePayload = {
        corregir: corregir.filter(a => a.description.trim()),
        afrontar: afrontar.filter(a => a.description.trim()),
        mantener: mantener.filter(a => a.description.trim()),
        explotar: explotar.filter(a => a.description.trim()),
      }
      const d = await saveGroupPlanCame(groupId, payload)
      setSummary(d)
      setNotice('Matriz CAME guardada correctamente.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const totalActions = corregir.length + afrontar.length + mantener.length + explotar.length

  return (
    <div className="came-editor">
      <div className="card-header">
        <Zap size={18} />
        <h2>Matriz CAME</h2>
        {summary?.updatedAt && (
          <span className="diag-updated">Actualizado: {new Date(summary.updatedAt).toLocaleDateString()}</span>
        )}
      </div>

      {error && <div className="alert" style={{ margin: '0 16px 12px' }}>{error}</div>}
      {notice && <div className="came-notice">{notice}</div>}

      {/* Resumen */}
      <div className="came-summary-grid">
        {QUADRANTS.map(q => (
          <div key={q.key} className="came-summary-card" style={{ borderTopColor: q.color }}>
            <div className="came-summary-num" style={{ color: q.color }}>{values[q.key].filter(a => a.description.trim()).length}</div>
            <div className="came-summary-label">{q.label}</div>
          </div>
        ))}
      </div>

      {/* Cuadrantes */}
      <div className="came-grid">
        {QUADRANTS.map(q => (
          <div key={q.key} className="came-quadrant">
            <div className="came-quadrant-header" style={{ borderLeftColor: q.color }}>
              <div>
                <strong style={{ color: q.color }}>{q.label}</strong>
                <span className="came-quadrant-desc">{q.description}</span>
              </div>
              <button type="button" className="btn btn-secondary came-add-btn" onClick={() => addAction(q.key)}>
                <Plus size={13} /> Agregar
              </button>
            </div>

            <div className="came-actions-list">
              {values[q.key].map((action, i) => (
                <div key={i} className="came-action-row">
                  <div className="came-action-body">
                    <textarea
                      value={action.description}
                      onChange={e => updateAction(q.key, i, 'description', e.target.value)}
                      placeholder={`Acción para ${q.label.toLowerCase()}...`}
                      rows={2}
                    />
                    <input
                      value={action.relatedFactor}
                      onChange={e => updateAction(q.key, i, 'relatedFactor', e.target.value)}
                      placeholder="Factor relacionado (opcional)"
                    />
                  </div>
                  <div className="came-action-side">
                    <select
                      value={action.priority}
                      onChange={e => updateAction(q.key, i, 'priority', e.target.value)}
                      style={{ color: PRIORITY_COLORS[action.priority as DiagnosticPriority] }}
                    >
                      {(['BAJA', 'MEDIA', 'ALTA'] as DiagnosticPriority[]).map(p => (
                        <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                      ))}
                    </select>
                    <button type="button" className="came-remove-btn" onClick={() => removeAction(q.key, i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions" style={{ padding: '0 16px 16px' }}>
        <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{totalActions} acción(es) registradas</span>
        <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
          <Save size={16} /> {saving ? 'Guardando...' : 'Guardar Matriz CAME'}
        </button>
      </div>
    </div>
  )
}
