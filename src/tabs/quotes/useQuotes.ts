import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { Quote, QuoteHistoryEntry, QuoteCoverages, Policy, Vehicle, VehicleUsageType, Proposal, ProposalStatus } from '../../types'
import {
  listQuotes, updateQuoteStatus, getQuoteHistory,
  listPolicies, listVehiclesAdmin, createVehicleAdmin, createQuoteAdmin,
  listProposalsByQuote, createProposal, updateProposalStatus,
} from '../../api/adminApi'

export const emptyCreateQuoteForm = {
  document: '',
  mode: 'novo' as 'novo' | 'renovacao',
  policyId: '',
  vehicleId: '',
  useNewVehicle: false,
  newVehicle: {
    plate: '',
    year: '',
    usageType: 'PARTICULAR' as VehicleUsageType,
    overnightCep: '',
  },
  coverages: {
    comprehensive: false,
    civil_liability: false,
    personal_accidents: false,
    rental_car: false,
  } as QuoteCoverages,
  notes: '',
}

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

  // ── Criação de Cotação (renovação / seguro novo) ─────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateQuoteForm)
  const [lookupDone, setLookupDone] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupPolicies, setLookupPolicies] = useState<Policy[]>([])
  const [lookupVehicles, setLookupVehicles] = useState<Vehicle[]>([])
  const [creating, setCreating] = useState(false)

  // ── Proposta ──────────────────────────────────────────────────────────────────
  const [openProposal, setOpenProposal] = useState<string | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [proposalLoading, setProposalLoading] = useState(false)
  const [pdfUrlDraft, setPdfUrlDraft] = useState('')
  const [proposalSaving, setProposalSaving] = useState(false)

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

  async function searchInsured() {
    if (!createForm.document) {
      setError('Documento é obrigatório pra buscar o segurado')
      return
    }
    setLookupLoading(true)
    setError(null)
    try {
      const [policies, vehicles] = await Promise.all([
        listPolicies(config, createForm.document),
        listVehiclesAdmin(config, createForm.document),
      ])
      setLookupPolicies(policies.filter((p) => p.type === 'AUTO'))
      setLookupVehicles(vehicles)
      setLookupDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLookupLoading(false)
    }
  }

  async function createQuote(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      let vehicleId = createForm.vehicleId
      if (createForm.useNewVehicle) {
        const { id } = await createVehicleAdmin(config, {
          document: createForm.document,
          plate: createForm.newVehicle.plate,
          year: parseInt(createForm.newVehicle.year, 10),
          usage_type: createForm.newVehicle.usageType,
          overnight_cep: createForm.newVehicle.overnightCep,
        })
        vehicleId = id
      }
      if (!vehicleId) {
        setError('Selecione ou cadastre um veículo')
        return
      }
      if (createForm.mode === 'renovacao' && !createForm.policyId) {
        setError('Selecione a apólice sendo renovada')
        return
      }

      await createQuoteAdmin(config, {
        document: createForm.document,
        vehicle_id: vehicleId,
        policy_id: createForm.mode === 'renovacao' ? createForm.policyId : undefined,
        coverages: createForm.coverages,
        notes: createForm.notes || undefined,
      })

      setCreateForm(emptyCreateQuoteForm)
      setLookupDone(false)
      setLookupPolicies([])
      setLookupVehicles([])
      setShowCreateForm(false)
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function toggleProposal(quoteId: string) {
    if (openProposal === quoteId) {
      setOpenProposal(null)
      return
    }
    setOpenProposal(quoteId)
    setPdfUrlDraft('')
    await loadProposals(quoteId)
  }

  async function loadProposals(quoteId: string) {
    setProposalLoading(true)
    try {
      setProposals(await listProposalsByQuote(config, quoteId))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProposalLoading(false)
    }
  }

  async function generateProposal(quoteId: string) {
    if (!pdfUrlDraft) {
      setError('URL do PDF é obrigatória')
      return
    }
    setProposalSaving(true)
    try {
      await createProposal(config, { quote_id: quoteId, pdf_url: pdfUrlDraft })
      setPdfUrlDraft('')
      await loadProposals(quoteId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProposalSaving(false)
    }
  }

  async function advanceProposal(quoteId: string, proposalId: string, nextStatus: ProposalStatus) {
    setProposalSaving(true)
    try {
      await updateProposalStatus(config, proposalId, nextStatus)
      await loadProposals(quoteId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProposalSaving(false)
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
    showCreateForm,
    setShowCreateForm,
    createForm,
    setCreateForm,
    lookupDone,
    lookupLoading,
    lookupPolicies,
    lookupVehicles,
    creating,
    searchInsured,
    createQuote,
    openProposal,
    proposals,
    proposalLoading,
    pdfUrlDraft,
    setPdfUrlDraft,
    proposalSaving,
    toggleProposal,
    generateProposal,
    advanceProposal,
  }
}
