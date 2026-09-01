import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { User, PersonType } from '../../types'
import { listUsers, createUser, deleteUser } from '../../api/adminApi'

// Estado + regras da tela de Usuários — equivalente a um ViewModel no Android.
// UsersTab.tsx só consome o que este hook devolve; nunca chama a API diretamente.

export const emptyUserForm: { email: string; password: string; name: string; document: string; person_type: PersonType } =
  { email: '', password: '', name: '', document: '', person_type: 'FISICA' }

export function useUsers(config: AdminConfig) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const [creating, setCreating] = useState(false)
  const [deletingUid, setDeletingUid] = useState<string | null>(null)

  function load() {
    listUsers(config)
      .then(setUsers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createUser(config, form)
      setForm(emptyUserForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function remove(u: User) {
    if (!confirm(`Excluir a conta de "${u.name}"?\n\nEsta ação é irreversível.`)) return
    setDeletingUid(u.uid)
    try {
      await deleteUser(config, u.uid)
      setUsers(users.filter((x) => x.uid !== u.uid))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingUid(null)
    }
  }

  return {
    users,
    loading,
    error,
    showForm,
    setShowForm,
    form,
    setForm,
    creating,
    deletingUid,
    create,
    remove,
  }
}
