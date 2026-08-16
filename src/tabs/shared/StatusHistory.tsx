// Timeline de transições de status — compartilhado entre ClaimsTab e QuotesTab.
// Genérico em S (o tipo de status) porque ClaimStatus e QuoteStatus são enums
// diferentes; cada tab continua dono da própria paleta de cores (badgeStyle).

interface HistoryEntry<S extends string> {
  from_status: S
  to_status: S
  note?: string
  changed_at: number
}

interface Props<S extends string> {
  loading: boolean
  entries: HistoryEntry<S>[]
  badgeStyle: Record<S, React.CSSProperties>
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

function formatDateTime(epochMs: number) {
  return new Date(epochMs).toLocaleString('pt-BR')
}

export function StatusHistory<S extends string>({ loading, entries, badgeStyle }: Props<S>) {
  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
      {loading ? (
        <div style={{ fontSize: 12, color: '#aaa' }}>Carregando...</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: 12, color: '#aaa' }}>Sem histórico de alterações</div>
      ) : (
        entries.map((h, i) => (
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
  )
}
