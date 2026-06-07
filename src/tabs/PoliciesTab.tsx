import { useState, useEffect } from 'react'
import type { AdminConfig } from '../api/adminApi'
import type { Policy, PolicyStatus } from '../types'
import { listPolicies } from '../api/adminApi'

interface Props {
  config: AdminConfig
}

const badgeStyle: Record<PolicyStatus, React.CSSProperties> = {
  ATIVO:     { background: '#e8f5e9', color: '#2e7d32' },
  PENDENTE:  { background: '#fff8e1', color: '#f57f17' },
  CANCELADO: { background: '#ffebee', color: '#c62828' },
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

export function PoliciesTab({ config }: Props) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    listPolicies(config)
      .then(setPolicies)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [config])

  if (loading) return <p>Carregando...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (policies.length === 0) return <p>Nenhuma apólice encontrada.</p>

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
          <th style={{ padding: '8px 12px' }}>Seguradora</th>
          <th style={{ padding: '8px 12px' }}>Tipo</th>
          <th style={{ padding: '8px 12px' }}>Status</th>
          <th style={{ padding: '8px 12px' }}>Início → Vencimento</th>
          <th style={{ padding: '8px 12px' }}>CPF</th>
        </tr>
      </thead>
      <tbody>
        {policies.map((p) => (
          <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.insurer_name}</td>
            <td style={{ padding: '10px 12px', color: '#555' }}>{p.type}</td>
            <td style={{ padding: '10px 12px' }}>
              <span style={{ ...badge, ...badgeStyle[p.status] }}>{p.status}</span>
            </td>
            <td style={{ padding: '10px 12px', color: '#777', fontSize: 12 }}>
              {formatDate(p.start_date)} → {formatDate(p.end_date)}
            </td>
            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#888' }}>
              {p.cpf}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
