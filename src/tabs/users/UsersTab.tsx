import type { AdminConfig } from '../../api/adminApi'
import type { User } from '../../types'
import { useUsers } from './useUsers'

// Props = parâmetros do composable/componente.
// Equivalente a: fun UsersTab(config: AdminConfig) no Compose.
interface Props {
  config: AdminConfig
}

export function UsersTab({ config }: Props) {
  const {
    users, loading, error,
    showForm, setShowForm,
    form, setForm,
    creating, deletingUid,
    create, remove,
  } = useUsers(config)

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Usuários</strong>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          + Novo Usuário
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={create} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Nome</label>
              <input
                required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>CPF</label>
              <input
                required placeholder="00000000000" value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>E-mail</label>
              <input
                required type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Senha</label>
              <input
                required type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
          </div>
          <button
            type="submit" disabled={creating}
            style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Criando...' : 'Criar Usuário'}
          </button>
        </form>
      )}

      {users.length === 0 ? (
        <p>Nenhum usuário encontrado.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '8px 12px' }}>Nome</th>
              <th style={{ padding: '8px 12px' }}>Email</th>
              <th style={{ padding: '8px 12px' }}>CPF</th>
              <th style={{ padding: '8px 12px' }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: User) => (
              // key = equivalente ao stableId no DiffUtil do RecyclerView
              <tr key={u.uid} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{u.email}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{u.cpf}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => remove(u)}
                    disabled={deletingUid === u.uid}
                    style={{ padding: '6px 12px', background: '#fff', color: '#c62828', border: '1px solid #c62828', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
                  >
                    {deletingUid === u.uid ? 'Excluindo...' : 'Excluir'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
