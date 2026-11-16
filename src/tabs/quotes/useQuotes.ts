import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { Quote, QuoteHistoryEntry, QuoteCoverages, Policy, Vehicle, VehicleUsageType, Proposal, ProposalStatus } from '../../types'
import {
  listQuotes, updateQuoteStatus, getQuoteHistory,
  listPolicies, listVehiclesAdmin, createVehicleAdmin, createQuoteAdmin,
  listProposalsByQuote, createProposal, updateProposalStatus, copyQuoteAdmin,
} from '../../api/adminApi'
import { endOfDayMs } from '../../lib/dates'

/** Traduz o erro de `POST /v1/admin/quotes/{id}/copy` numa frase; texto desconhecido segue como veio. */
export function describeCopyQuoteError(err: Error): string {
  const msg = err.message
  if (msg.includes('quote not expired')) return 'Só uma cotação expirada pode ser copiada.'
  if (msg.includes('Quote not found')) return 'Cotação não encontrada.'
  if (msg.includes('→ 403')) return 'Chave de admin inválida. Confira o campo Admin Key.'
  return msg.trim()
}

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

export interface CopyDraft {
  coverages: QuoteCoverages
  notes: string
  /** Valor e validade são opcionais: com os dois, a nova cotação já nasce respondida. */
  premium: string
  validUntil: string
}

const emptyCopyDraft: CopyDraft = {
  coverages: { comprehensive: false, civil_liability: false, personal_accidents: false, rental_car: false },
  notes: '',
  premium: '',
  validUntil: '',
}

export function useQuotes(config: AdminConfig) {
  const [quotes, setQuotes]   = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [notice, setNotice]   = useState<string | null>(null)

  // Cópia de cotação expirada: o formulário abre pré-preenchido para a corretora ajustar o que mudou.
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const [copyDraft, setCopyDraft] = useState<CopyDraft>(emptyCopyDraft)

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
  const [proposedPremiumDraft, setProposedPremiumDraft] = useState('')
  const [proposalValidUntilDraft, setProposalValidUntilDraft] = useState('')
  const [proposalSaving, setProposalSaving] = useState(false)

  function load() {
    listQuotes(config)
      .then(setQuotes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  async function respond(id: string) {
    setNotice(null)
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
        valid_until: endOfDayMs(validRaw),
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
    setNotice(null)
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

  // Cotação expirada: a corretora a copia numa cotação nova e ajusta o que mudou (coberturas e observações). Se já souber
  // o valor e a validade, a nova cotação nasce respondida; senão, aguardando. A expirada continua como está.
  function openCopy(q: Quote) {
    setNotice(null)
    setError(null)
    setCopyingId(q.id)
    setCopyDraft({ coverages: q.coverages, notes: q.notes ?? '', premium: '', validUntil: '' })
  }

  function cancelCopy() {
    setCopyingId(null)
  }

  async function submitCopy(id: string) {
    setNotice(null)
    setError(null)
    const hasPremium = copyDraft.premium.trim() !== ''
    const hasValidUntil = copyDraft.validUntil !== ''
    if (hasPremium !== hasValidUntil) {
      setError('Informe o valor e a validade juntos, ou deixe os dois em branco.')
      return
    }
    const premium = parseFloat(copyDraft.premium)
    if (hasPremium && (Number.isNaN(premium) || premium <= 0)) {
      setError('Valor inválido.')
      return
    }

    setSaving(id)
    try {
      const { id: newId } = await copyQuoteAdmin(config, id, { coverages: copyDraft.coverages, notes: copyDraft.notes })
      if (!hasPremium) {
        setNotice('Cotação copiada: a nova cotação está aguardando resposta.')
      } else {
        try {
          await updateQuoteStatus(config, newId, 'RESPONDIDA', {
            premium,
            valid_until: endOfDayMs(copyDraft.validUntil),
            notes: '',
          })
          setNotice('Cotação copiada e já respondida.')
        } catch (err) {
          // A cópia existe e está aguardando: não desfaz, só avisa para responder pela lista.
          setNotice('Cotação copiada, mas não foi possível responder. Responda a nova cotação na lista.')
          setError((err as Error).message)
        }
      }
      setCopyingId(null)
      load()
    } catch (err) {
      setError(describeCopyQuoteError(err as Error))
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
    setProposedPremiumDraft('')
    setProposalValidUntilDraft('')
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
    if (!pdfUrlDraft || !proposedPremiumDraft || !proposalValidUntilDraft) {
      setError('URL do PDF, prêmio proposto e validade são obrigatórios')
      return
    }
    setProposalSaving(true)
    try {
      await createProposal(config, {
        quote_id: quoteId,
        pdf_url: pdfUrlDraft,
        proposed_premium: parseFloat(proposedPremiumDraft) || 0,
        valid_until: new Date(proposalValidUntilDraft).getTime(),
      })
      setPdfUrlDraft('')
      setProposedPremiumDraft('')
      setProposalValidUntilDraft('')
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
    notice,
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
    copyingId,
    copyDraft,
    setCopyDraft,
    openCopy,
    cancelCopy,
    submitCopy,
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
    proposedPremiumDraft,
    setProposedPremiumDraft,
    proposalValidUntilDraft,
    setProposalValidUntilDraft,
    proposalSaving,
    toggleProposal,
    generateProposal,
    advanceProposal,
  }
}
