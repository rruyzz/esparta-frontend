import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { Policy, PolicyStatus, PolicyType } from '../../types'
import { listPolicies, createPolicy } from '../../api/adminApi'

export const emptyPolicyForm = {
  cpf: '',
  insurerName: '',
  type: 'AUTO' as PolicyType,
  startDate: '',
  endDate: '',
  status: 'ATIVO' as PolicyStatus,
  pdfUrl: '',
}

export function usePolicies(config: AdminConfig) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyPolicyForm)
  const [creating, setCreating] = useState(false)

  function load() {
    listPolicies(config)
      .then(setPolicies)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createPolicy(config, {
        cpf: form.cpf,
        insurer_name: form.insurerName,
        type: form.type,
        start_date: new Date(form.startDate).getTime(),
        end_date: new Date(form.endDate).getTime(),
        status: form.status,
        pdf_url: form.pdfUrl || undefined,
      })
      setForm(emptyPolicyForm)
      setShowForm(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  return {
    policies,
    loading,
    error,
    showForm,
    setShowForm,
    form,
    setForm,
    creating,
    create,
  }
}
