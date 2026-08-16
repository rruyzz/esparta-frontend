import { useState, useEffect } from 'react'
import type { AdminConfig } from '../api/adminApi'
import type { User } from '../types'
import { listUsers } from '../api/adminApi'

// Props = parâmetros do composable/componente.
// Equivalente a: fun UsersTab(config: AdminConfig) no Compose.
interface Props {
  config: AdminConfig
}

export function UsersTab({ config }: Props) {
  // useState = MutableStateFlow no ViewModel.
  // [valor, função que atualiza o valor]
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useEffect = LaunchedEffect no Compose / viewModelScope.launch no ViewModel.
  // Roda quando o componente é montado ([] = sem dependências = só uma vez).
  useEffect(() => {
    listUsers(config)
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [config])

  if (loading) return <p>Carregando...</p>
  if (error)   return <p style={{ color: 'red' }}>{error}</p>
  if (users.length === 0) return <p>Nenhum usuário encontrado.</p>

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
          <th style={{ padding: '8px 12px' }}>Nome</th>
          <th style={{ padding: '8px 12px' }}>Email</th>
          <th style={{ padding: '8px 12px' }}>CPF</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          // key = equivalente ao stableId no DiffUtil do RecyclerView
          <tr key={u.uid} style={{ borderBottom: '1px solid #f0f0f0' }}>
            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{u.name}</td>
            <td style={{ padding: '10px 12px', color: '#555' }}>{u.email}</td>
            <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{u.cpf}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
