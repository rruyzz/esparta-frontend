import type { AdminConfig } from '../../api/adminApi'
import type { PolicyStatus, PolicyType } from '../../types'
import { usePolicies } from './usePolicies'

interface Props {
  config: AdminConfig
}

const POLICY_TYPES: PolicyType[] = ['VIDA', 'AUTO', 'RESIDENCIAL', 'SAUDE', 'VIAGEM']
const POLICY_STATUSES: PolicyStatus[] = ['ATIVO', 'PENDENTE', 'CANCELADO']

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
  const {
    policies, loading, error,
    showForm, setShowForm,
    form, setForm,
    creating, create,
  } = usePolicies(config)

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Apólices</strong>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          + Nova Apólice
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={create} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>CPF do segurado</label>
              <input
                required placeholder="00000000000" value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Seguradora</label>
              <input
                required placeholder="Porto Seguro" value={form.insurerName}
                onChange={(e) => setForm({ ...form, insurerName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PolicyType })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Início</label>
              <input
                required type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Vencimento</label>
              <input
                required type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PolicyStatus })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {POLICY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>URL do PDF (opcional)</label>
            <input
              placeholder="https://..." value={form.pdfUrl}
              onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
            />
          </div>
          <button
            type="submit" disabled={creating}
            style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Criando...' : 'Criar Apólice'}
          </button>
        </form>
      )}

      {policies.length === 0 ? (
        <p>Nenhuma apólice encontrada.</p>
      ) : (
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
      )}
    </div>
  )
}
