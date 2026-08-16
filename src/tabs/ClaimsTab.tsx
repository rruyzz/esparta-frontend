import { useState, useEffect } from 'react'
import type { AdminConfig } from '../api/adminApi'
import type { Claim, ClaimStatus, ClaimHistoryEntry } from '../types'
import { listClaims, updateClaimStatus, getClaimHistory } from '../api/adminApi'

interface Props {
  config: AdminConfig
}

const CLAIM_STATUSES: ClaimStatus[] = ['ABERTO', 'EM_ANALISE', 'DOCUMENTACAO_PENDENTE', 'ENCERRADO']

const badgeStyle: Record<ClaimStatus, React.CSSProperties> = {
  ABERTO:                 { background: '#f0f0f0', color: '#555' },
  EM_ANALISE:             { background: '#e3f2fd', color: '#1565c0' },
  DOCUMENTACAO_PENDENTE:  { background: '#fff8e1', color: '#f57f17' },
  ENCERRADO:              { background: '#e8f5e9', color: '#2e7d32' },
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString('pt-BR')
}

function formatDateTime(epochMs: number) {
  return new Date(epochMs).toLocaleString('pt-BR')
}

export function ClaimsTab({ config }: Props) {
  const [claims, setClaims]   = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Estado de edição por linha — equivalente a um Map<id, UiState> no ViewModel.
  const [statusDraft, setStatusDraft] = useState<Record<string, ClaimStatus>>({})
  const [noteDraft, setNoteDraft]     = useState<Record<string, string>>({})
  const [saving, setSaving]           = useState<string | null>(null)
  const [openHistory, setOpenHistory] = useState<string | null>(null)
  const [history, setHistory]         = useState<ClaimHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  function load() {
    listClaims(config)
      .then((data) => {
        setClaims(data)
        setStatusDraft(Object.fromEntries(data.map((c) => [c.id, c.status])))
        setNoteDraft(Object.fromEntries(data.map((c) => [c.id, c.status_note ?? ''])))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  async function handleSave(id: string) {
    setSaving(id)
    try {
      await updateClaimStatus(config, id, statusDraft[id], noteDraft[id])
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  async function handleToggleHistory(id: string) {
    if (openHistory === id) {
      setOpenHistory(null)
      return
    }
    setOpenHistory(id)
    setHistoryLoading(true)
    try {
      setHistory(await getClaimHistory(config, id))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) return <p>Carregando...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (claims.length === 0) return <p>Nenhum sinistro encontrado.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {claims.map((c) => (
        <div key={c.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 14, fontSize: 13 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <strong>{c.occurrence_type}</strong>
            <span style={{ flex: 1, color: '#555' }}>{c.description}</span>
            <span style={{ ...badge, ...badgeStyle[c.status] }}>{c.status}</span>
            <span style={{ color: '#999', fontSize: 12 }}>{formatDate(c.opened_at)}</span>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
            <select
              value={statusDraft[c.id] ?? c.status}
              onChange={(e) => setStatusDraft({ ...statusDraft, [c.id]: e.target.value as ClaimStatus })}
              style={{ fontSize: 13, border: '1px solid #ccc', borderRadius: 8, padding: '6px 10px', width: 'auto', flexShrink: 0 }}
            >
              {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <textarea
              placeholder="Nota para o segurado (opcional)"
              value={noteDraft[c.id] ?? ''}
              onChange={(e) => setNoteDraft({ ...noteDraft, [c.id]: e.target.value })}
              style={{ flex: 1, resize: 'vertical', minHeight: 36, padding: '6px 10px', border: '1px solid #ccc', borderRadius: 8, fontSize: 13, background: '#fafafa' }}
            />
            <button
              onClick={() => handleSave(c.id)}
              disabled={saving === c.id}
              style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {saving === c.id ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => handleToggleHistory(c.id)}
              style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
            >
              Histórico
            </button>
          </div>

          {openHistory === c.id && (
            <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
              {historyLoading ? (
                <div style={{ fontSize: 12, color: '#aaa' }}>Carregando...</div>
              ) : history.length === 0 ? (
                <div style={{ fontSize: 12, color: '#aaa' }}>Sem histórico de alterações</div>
              ) : (
                history.map((h) => (
                  <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f8f8f8', fontSize: 12 }}>
                    <span style={{ color: '#aaa', whiteSpace: 'nowrap', minWidth: 110 }}>{formatDateTime(h.changed_at)}</span>
                    <span style={{ ...badge, ...badgeStyle[h.from_status], fontSize: 10 }}>{h.from_status}</span>
                    <span style={{ color: '#bbb' }}>→</span>
                    <span style={{ ...badge, ...badgeStyle[h.to_status], fontSize: 10 }}>{h.to_status}</span>
                    {h.note && <span style={{ color: '#777', fontStyle: 'italic' }}>"{h.note}"</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
