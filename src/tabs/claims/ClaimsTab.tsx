import type { AdminConfig } from '../../api/adminApi'
import type { ClaimStatus, OccurrenceType } from '../../types'
import { useClaims } from './useClaims'
import { StatusHistory } from '../shared/StatusHistory'

interface Props {
  config: AdminConfig
}

const CLAIM_STATUSES: ClaimStatus[] = ['ABERTO', 'EM_ANALISE', 'DOCUMENTACAO_PENDENTE', 'ENCERRADO']
const OCCURRENCE_TYPES: OccurrenceType[] = ['COLISAO', 'ROUBO', 'INCENDIO', 'OUTRO']

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

export function ClaimsTab({ config }: Props) {
  const {
    claims, loading, error,
    showForm, setShowForm,
    form, setForm,
    creating, create,
    statusDraft, setStatusDraft,
    noteDraft, setNoteDraft,
    saving, openHistory, history, historyLoading,
    save, toggleHistory,
  } = useClaims(config)

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Sinistros</strong>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          + Novo Sinistro
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={create} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Documento do segurado (CPF/CNPJ)</label>
              <input
                required placeholder="00000000000" value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>ID da apólice</label>
              <input
                required placeholder="ID interno da apólice" value={form.policyId}
                onChange={(e) => setForm({ ...form, policyId: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Tipo de ocorrência</label>
              <select
                value={form.occurrenceType}
                onChange={(e) => setForm({ ...form, occurrenceType: e.target.value as OccurrenceType })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {OCCURRENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Descrição</label>
            <textarea
              required placeholder="O que aconteceu" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', resize: 'vertical', minHeight: 60, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>URL da foto (opcional)</label>
            <input
              placeholder="https://..." value={form.photoUrl}
              onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
            />
          </div>
          <button
            type="submit" disabled={creating}
            style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Abrindo...' : 'Abrir Sinistro'}
          </button>
        </form>
      )}

      {claims.length === 0 && <p>Nenhum sinistro encontrado.</p>}

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
                onClick={() => save(c.id)}
                disabled={saving === c.id}
                style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {saving === c.id ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => toggleHistory(c.id)}
                style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Histórico
              </button>
            </div>

            {openHistory === c.id && (
              <StatusHistory loading={historyLoading} entries={history} badgeStyle={badgeStyle} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
