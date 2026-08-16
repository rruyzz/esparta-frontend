import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { Claim, ClaimStatus, ClaimHistoryEntry } from '../../types'
import { listClaims, updateClaimStatus, getClaimHistory } from '../../api/adminApi'

export function useClaims(config: AdminConfig) {
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

  async function save(id: string) {
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

  async function toggleHistory(id: string) {
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

  return {
    claims,
    loading,
    error,
    statusDraft,
    setStatusDraft,
    noteDraft,
    setNoteDraft,
    saving,
    openHistory,
    history,
    historyLoading,
    save,
    toggleHistory,
  }
}
