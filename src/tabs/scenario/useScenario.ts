import { useState } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import {
  createUser,
  updateUserProfile,
  createVehicleAdmin,
  createQuoteAdmin,
  updateQuoteStatus,
  createProposal,
  updateProposalStatus,
  createPolicy,
} from '../../api/adminApi'
import type {
  PersonType,
  VehicleUsageType,
  QuoteCoverages,
  QuoteStatus,
  ProposalStatus,
} from '../../types'
import {
  emptyPolicyForm,
  emptyCoverage,
  emptyVehicle as emptyPolicyVehicle,
  emptyOwner,
  emptyInsuredDetails,
  emptyMainDriver,
  toCreatePolicyPayload,
  type CoverageForm,
  type VehicleForm as PolicyVehicleForm,
  type OwnerForm,
  type InsuredDetailsForm,
  type MainDriverForm,
} from '../policies/usePolicies'
import {
  randomName,
  randomEmail,
  DEV_PASSWORD,
  randomCPF,
  randomCNPJ,
  randomPhone,
  randomAddress,
  randomPlate,
  randomYear,
  randomInsurer,
  randomMakeModel,
  randomPolicyNumber,
  randomEndorsementNumber,
  randomPdfUrl,
  randomPremium,
  daysFromNow,
  toDateInputValue,
} from '../../lib/fakeData'

export interface AccountForm {
  name: string
  email: string
  password: string
  document: string
  personType: PersonType
  phone: string
  address: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
}

export interface VehicleStepForm {
  enabled: boolean
  plate: string
  year: string
  usageType: VehicleUsageType
  overnightCep: string
}

export interface QuoteStepForm {
  enabled: boolean
  coverages: QuoteCoverages
  notes: string
  targetStatus: QuoteStatus
  premium: string
  validUntil: string
  responseNotes: string
}

export interface ProposalStepForm {
  enabled: boolean
  pdfUrl: string
  proposedPremium: string
  validUntil: string
  targetStatus: ProposalStatus
}

export interface LogEntry {
  step: string
  status: 'ok' | 'error'
  message: string
}

const emptyAccount: AccountForm = {
  name: '',
  email: '',
  password: DEV_PASSWORD,
  document: '',
  personType: 'FISICA',
  phone: '',
  address: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' },
}

const emptyVehicleStep: VehicleStepForm = {
  enabled: false,
  plate: '',
  year: '',
  usageType: 'PARTICULAR',
  overnightCep: '',
}

const emptyQuoteStep: QuoteStepForm = {
  enabled: false,
  coverages: { comprehensive: true, civil_liability: true, personal_accidents: false, rental_car: false },
  notes: '',
  targetStatus: 'FECHADA',
  premium: '',
  validUntil: '',
  responseNotes: '',
}

const emptyProposalStep: ProposalStepForm = {
  enabled: false,
  pdfUrl: '',
  proposedPremium: '',
  validUntil: '',
  targetStatus: 'GERADA',
}

export function useScenario(config: AdminConfig) {
  const [account, setAccountState] = useState<AccountForm>(emptyAccount)
  const [vehicle, setVehicleState] = useState<VehicleStepForm>(emptyVehicleStep)
  const [quote, setQuoteState] = useState<QuoteStepForm>(emptyQuoteStep)
  const [proposal, setProposalState] = useState<ProposalStepForm>(emptyProposalStep)
  const [policy, setPolicy] = useState(emptyPolicyForm)
  const [policyEnabled, setPolicyEnabled] = useState(false)

  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])

  function setAccount(patch: Partial<AccountForm>) {
    setAccountState({ ...account, ...patch })
  }

  function setAddress(patch: Partial<AccountForm['address']>) {
    setAccountState({ ...account, address: { ...account.address, ...patch } })
  }

  function setVehicle(patch: Partial<VehicleStepForm>) {
    setVehicleState({ ...vehicle, ...patch })
  }

  function setQuote(patch: Partial<QuoteStepForm>) {
    setQuoteState({ ...quote, ...patch })
  }

  function setQuoteCoverages(patch: Partial<QuoteCoverages>) {
    setQuoteState({ ...quote, coverages: { ...quote.coverages, ...patch } })
  }

  function setProposal(patch: Partial<ProposalStepForm>) {
    setProposalState({ ...proposal, ...patch })
  }

  function addPolicyCoverage() {
    setPolicy({ ...policy, coverages: [...policy.coverages, { ...emptyCoverage }] })
  }

  function removePolicyCoverage(index: number) {
    setPolicy({ ...policy, coverages: policy.coverages.filter((_, i) => i !== index) })
  }

  function updatePolicyCoverage(index: number, patch: Partial<CoverageForm>) {
    setPolicy({ ...policy, coverages: policy.coverages.map((c, i) => (i === index ? { ...c, ...patch } : c)) })
  }

  function setPolicyVehicle(patch: Partial<PolicyVehicleForm>) {
    setPolicy({ ...policy, vehicle: { ...policy.vehicle, ...patch } })
  }

  function setPolicyOwner(patch: Partial<OwnerForm>) {
    setPolicy({ ...policy, owner: { ...policy.owner, ...patch } })
  }

  function setPolicyInsuredDetails(patch: Partial<InsuredDetailsForm>) {
    setPolicy({ ...policy, insuredDetails: { ...policy.insuredDetails, ...patch } })
  }

  function setPolicyMainDriver(patch: Partial<MainDriverForm>) {
    setPolicy({ ...policy, mainDriver: { ...policy.mainDriver, ...patch } })
  }

  function randomizeAccount() {
    const name = randomName()
    const personType: PersonType = account.personType
    setAccountState({
      ...account,
      name,
      email: randomEmail(name),
      password: DEV_PASSWORD,
      document: personType === 'JURIDICA' ? randomCNPJ() : randomCPF(),
      phone: randomPhone(),
      address: randomAddress(),
    })
  }

  function randomizeVehicle() {
    setVehicleState({
      ...vehicle,
      plate: randomPlate(),
      year: String(randomYear()),
      usageType: 'PARTICULAR',
      overnightCep: account.address.cep || randomAddress().cep,
    })
  }

  function randomizeQuote() {
    setQuoteState({
      ...quote,
      coverages: { comprehensive: true, civil_liability: true, personal_accidents: true, rental_car: false },
      notes: 'Cotação gerada pelo Cenário Rápido',
      premium: String(randomPremium()),
      validUntil: toDateInputValue(daysFromNow(30)),
      responseNotes: 'Proposta padrão',
    })
  }

  function randomizeProposal() {
    setProposalState({
      ...proposal,
      pdfUrl: randomPdfUrl('proposta'),
      proposedPremium: String(randomPremium()),
      validUntil: toDateInputValue(daysFromNow(30)),
    })
  }

  function randomizePolicy() {
    const isAuto = policy.type === 'AUTO'
    setPolicy({
      ...policy,
      insurerName: randomInsurer(),
      startDate: toDateInputValue(Date.now()),
      endDate: toDateInputValue(daysFromNow(365)),
      pdfUrl: randomPdfUrl('apolice'),
      policyNumber: randomPolicyNumber(),
      endorsementNumber: randomEndorsementNumber(),
      premiumAmount: String(randomPremium()),
      paymentType: 'A_VISTA',
      coverages: isAuto ? [
        { name: 'Colisão', coverageLimit: '80000', premium: String(randomPremium()), deductible: '2500' },
        { name: 'Roubo/Furto', coverageLimit: '80000', premium: String(randomPremium()), deductible: '2000' },
      ] : [],
      vehicle: isAuto ? {
        ...emptyPolicyVehicle,
        plate: randomPlate(),
        makeModel: randomMakeModel(),
        year: String(randomYear()),
        overnightCep: account.address.cep || randomAddress().cep,
      } : emptyPolicyVehicle,
      hasOwner: false,
      owner: emptyOwner,
      insuredDetails: isAuto ? {
        ...emptyInsuredDetails,
        document: account.document,
        personType: account.personType,
        birthDate: toDateInputValue(daysFromNow(-365 * 30)),
        maritalStatus: 'SOLTEIRO',
        bonusClass: 'A',
        ci: randomPolicyNumber(),
      } : emptyInsuredDetails,
      hasMainDriver: false,
      mainDriver: emptyMainDriver,
    })
  }

  function pushLog(entry: LogEntry) {
    setLog((current) => [...current, entry])
  }

  async function runScenario() {
    setRunning(true)
    setLog([])

    let uid: string | undefined
    let vehicleId: string | undefined
    let quoteId: string | undefined

    try {
      const created = await createUser(config, {
        email: account.email,
        password: account.password,
        name: account.name,
        document: account.document,
        person_type: account.personType,
      })
      uid = created.uid
      pushLog({ step: 'Conta', status: 'ok', message: `uid ${uid}` })
    } catch (err) {
      pushLog({ step: 'Conta', status: 'error', message: (err as Error).message })
      setRunning(false)
      return
    }

    try {
      await updateUserProfile(config, uid, { phone: account.phone || undefined, address: account.address })
      pushLog({ step: 'Endereço', status: 'ok', message: 'endereço gravado' })
    } catch (err) {
      pushLog({ step: 'Endereço', status: 'error', message: (err as Error).message })
    }

    if (vehicle.enabled) {
      try {
        const created = await createVehicleAdmin(config, {
          document: account.document,
          plate: vehicle.plate,
          year: parseInt(vehicle.year, 10) || 0,
          usage_type: vehicle.usageType,
          overnight_cep: vehicle.overnightCep,
        })
        vehicleId = created.id
        pushLog({ step: 'Veículo', status: 'ok', message: `id ${vehicleId}` })
      } catch (err) {
        pushLog({ step: 'Veículo', status: 'error', message: (err as Error).message })
      }
    }

    if (quote.enabled) {
      if (!vehicleId) {
        pushLog({ step: 'Cotação', status: 'error', message: 'pulado: precisa de um veículo criado' })
      } else {
        try {
          const created = await createQuoteAdmin(config, {
            document: account.document,
            vehicle_id: vehicleId,
            coverages: quote.coverages,
            notes: quote.notes || undefined,
          })
          quoteId = created.id
          pushLog({ step: 'Cotação', status: 'ok', message: `id ${quoteId}` })

          if (quote.targetStatus === 'RESPONDIDA' || quote.targetStatus === 'FECHADA') {
            await updateQuoteStatus(config, quoteId, 'RESPONDIDA', {
              premium: parseFloat(quote.premium) || 0,
              valid_until: quote.validUntil ? new Date(quote.validUntil).getTime() : daysFromNow(30),
              notes: quote.responseNotes || undefined,
            })
            pushLog({ step: 'Cotação → RESPONDIDA', status: 'ok', message: quoteId })
          }
          if (quote.targetStatus === 'FECHADA') {
            await updateQuoteStatus(config, quoteId, 'FECHADA')
            pushLog({ step: 'Cotação → FECHADA', status: 'ok', message: quoteId })
          }
        } catch (err) {
          pushLog({ step: 'Cotação', status: 'error', message: (err as Error).message })
        }
      }
    }

    if (proposal.enabled) {
      if (!quoteId || quote.targetStatus !== 'FECHADA') {
        pushLog({ step: 'Proposta', status: 'error', message: 'pulado: precisa de uma cotação FECHADA' })
      } else {
        try {
          const created = await createProposal(config, {
            quote_id: quoteId,
            pdf_url: proposal.pdfUrl,
            proposed_premium: parseFloat(proposal.proposedPremium) || 0,
            valid_until: proposal.validUntil ? new Date(proposal.validUntil).getTime() : daysFromNow(30),
          })
          const proposalId = created.id
          pushLog({ step: 'Proposta', status: 'ok', message: `id ${proposalId}` })

          if (proposal.targetStatus === 'ENVIADA' || proposal.targetStatus === 'ASSINADA') {
            await updateProposalStatus(config, proposalId, 'ENVIADA')
            pushLog({ step: 'Proposta → ENVIADA', status: 'ok', message: proposalId })
          }
          if (proposal.targetStatus === 'ASSINADA') {
            await updateProposalStatus(config, proposalId, 'ASSINADA')
            pushLog({ step: 'Proposta → ASSINADA', status: 'ok', message: proposalId })
          }
        } catch (err) {
          pushLog({ step: 'Proposta', status: 'error', message: (err as Error).message })
        }
      }
    }

    if (policyEnabled) {
      try {
        const created = await createPolicy(config, toCreatePolicyPayload({ ...policy, document: account.document }))
        pushLog({ step: 'Apólice', status: 'ok', message: `id ${created.id}` })
      } catch (err) {
        pushLog({ step: 'Apólice', status: 'error', message: (err as Error).message })
      }
    }

    setRunning(false)
  }

  return {
    account,
    setAccount,
    setAddress,
    randomizeAccount,

    vehicle,
    setVehicle,
    randomizeVehicle,

    quote,
    setQuote,
    setQuoteCoverages,
    randomizeQuote,

    proposal,
    setProposal,
    randomizeProposal,

    policy,
    setPolicy,
    policyEnabled,
    setPolicyEnabled,
    randomizePolicy,
    addPolicyCoverage,
    removePolicyCoverage,
    updatePolicyCoverage,
    setPolicyVehicle,
    setPolicyOwner,
    setPolicyInsuredDetails,
    setPolicyMainDriver,

    running,
    log,
    runScenario,
  }
}
