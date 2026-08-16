import { useState, useEffect } from 'react'
import type { AdminConfig } from '../api/adminApi'
import type { Quote, QuoteHistoryEntry } from '../types'
import { listQuotes, updateQuoteStatus, getQuoteHistory } from '../api/adminApi'

export function useQuotes(config: AdminConfig) {
  const [quotes, setQuotes]   = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [premiumDraft, setPremiumDraft] = useState<Record<string, string>>({})
  const [validUntilDraft, setValidUntilDraft] = useState<Record<string, string>>({})
  const [notesDraft, setNotesDraft]     = useState<Record<string, string>>({})
  const [saving, setSaving]             = useState<string | null>(null)
  const [openHistory, setOpenHistory]   = useState<string | null>(null)
  const [history, setHistory]           = useState<QuoteHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  function load() {
    listQuotes(config)
      .then(setQuotes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  async function respond(id: string) {
    const premium = parseFloat(premiumDraft[id])
    const validRaw = validUntilDraft[id]
    if (!premium || Number.isNaN(premium) || premium <= 0) {
      setError('Prêmio inválido')
      return
    }
    if (!validRaw) {
      setError('Data de validade obrigatória')
      return
    }
    setSaving(id)
    try {
      await updateQuoteStatus(config, id, 'RESPONDIDA', {
        premium,
        valid_until: new Date(validRaw).getTime(),
        notes: notesDraft[id] ?? '',
      })
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(null)
    }
  }

  async function close(id: string) {
    setSaving(id)
    try {
      await updateQuoteStatus(config, id, 'FECHADA')
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
      setHistory(await getQuoteHistory(config, id))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setHistoryLoading(false)
    }
  }

  return {
    quotes,
    loading,
    error,
    premiumDraft,
    setPremiumDraft,
    validUntilDraft,
    setValidUntilDraft,
    notesDraft,
    setNotesDraft,
    saving,
    openHistory,
    history,
    historyLoading,
    respond,
    close,
    toggleHistory,
  }
}
