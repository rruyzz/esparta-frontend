import type { AdminConfig } from '../../api/adminApi'
import type { QuoteStatus, QuoteCoverages } from '../../types'
import { useQuotes } from './useQuotes'

interface Props {
  config: AdminConfig
}

const badgeStyle: Record<QuoteStatus, React.CSSProperties> = {
  AGUARDANDO: { background: '#fff8e1', color: '#f57f17' },
  RESPONDIDA: { background: '#e3f2fd', color: '#1565c0' },
  FECHADA:    { background: '#e8f5e9', color: '#2e7d32' },
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

const coverageLabels: Record<keyof QuoteCoverages, string> = {
  comprehensive:      'Compreensiva',
  civil_liability:    'Resp. Civil',
  personal_accidents: 'Acid. Pessoais',
  rental_car:         'Carro Reserva',
}

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString('pt-BR')
}

function formatDateTime(epochMs: number) {
  return new Date(epochMs).toLocaleString('pt-BR')
}

function formatMoney(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function QuotesTab({ config }: Props) {
  const {
    quotes, loading, error,
    premiumDraft, setPremiumDraft,
    validUntilDraft, setValidUntilDraft,
    notesDraft, setNotesDraft,
    saving, openHistory, history, historyLoading,
    respond, close, toggleHistory,
  } = useQuotes(config)

  if (loading) return <p>Carregando...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (quotes.length === 0) return <p>Nenhuma cotação encontrada.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {quotes.map((q) => {
        const activeCoverages = (Object.keys(coverageLabels) as (keyof QuoteCoverages)[])
          .filter((k) => q.coverages[k])
          .map((k) => coverageLabels[k])

        return (
          <div key={q.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 14, fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>{q.vehicle_snapshot.plate || '—'}</span>
              <span style={{ color: '#555' }}>{q.vehicle_snapshot.year} · {q.vehicle_snapshot.usage_type}</span>
              <span style={{ flex: 1 }} />
              <span style={{ ...badge, ...badgeStyle[q.status] }}>{q.status}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{formatDate(q.created_at)}</span>
            </div>

            <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
              {activeCoverages.length ? activeCoverages.join(' · ') : 'Nenhuma cobertura selecionada'}
            </div>

            {q.notes && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Obs. do segurado: "{q.notes}"</div>
            )}

            {q.status === 'AGUARDANDO' && (
              <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Prêmio anual (R$)</label>
                    <input
                      type="number" step="0.01" min="0" placeholder="3200.00"
                      value={premiumDraft[q.id] ?? ''}
                      onChange={(e) => setPremiumDraft({ ...premiumDraft, [q.id]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Válido até</label>
                    <input
                      type="date"
                      value={validUntilDraft[q.id] ?? ''}
                      onChange={(e) => setValidUntilDraft({ ...validUntilDraft, [q.id]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Observações (opcional)</label>
                  <textarea
                    placeholder="Ex.: Inclui assistência 24h, franquia reduzida disponível..."
                    value={notesDraft[q.id] ?? ''}
                    onChange={(e) => setNotesDraft({ ...notesDraft, [q.id]: e.target.value })}
                    style={{ width: '100%', resize: 'vertical', minHeight: 60, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => respond(q.id)}
                    disabled={saving === q.id}
                    style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {saving === q.id ? 'Enviando...' : 'Responder cotação'}
                  </button>
                  <button
                    onClick={() => toggleHistory(q.id)}
                    style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Histórico
                  </button>
                </div>
              </div>
            )}

            {q.status !== 'AGUARDANDO' && q.response && (
              <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{formatMoney(q.response.premium)}</div>
                {q.status === 'RESPONDIDA' && (
                  <div style={{ color: '#555' }}>Válido até: <strong>{formatDate(q.response.valid_until)}</strong></div>
                )}
                {q.response.notes && (
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: '#555' }}>"{q.response.notes}"</div>
                )}
                <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
                  {q.status === 'RESPONDIDA' && q.responded_at && `Respondido em ${formatDateTime(q.responded_at)}`}
                  {q.status === 'FECHADA' && q.closed_at && `Fechada em ${formatDateTime(q.closed_at)}`}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {q.status === 'RESPONDIDA' && (
                    <button
                      onClick={() => close(q.id)}
                      disabled={saving === q.id}
                      style={{ padding: '8px 16px', background: '#fff', color: '#c62828', border: '1px solid #c62828', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      {saving === q.id ? 'Fechando...' : 'Fechar cotação'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleHistory(q.id)}
                    style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Histórico
                  </button>
                </div>
              </div>
            )}

            {openHistory === q.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                {historyLoading ? (
                  <div style={{ fontSize: 12, color: '#aaa' }}>Carregando...</div>
                ) : history.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#aaa' }}>Sem histórico</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f8f8f8', fontSize: 12 }}>
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
        )
      })}
    </div>
  )
}
