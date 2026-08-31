import { useState, useEffect } from 'react'
import type { AdminConfig } from '../../api/adminApi'
import type { Policy, PolicyStatus, PolicyType, PaymentType } from '../../types'
import { listPolicies, createPolicy, updatePolicyStatus } from '../../api/adminApi'

// Formulário guarda número/data como string (mesmo padrão de QuotesTab —
// ex. `newVehicle.year`, `premiumDraft`) — convertidos pro shape da API só
// no submit, em create().

export interface CoverageForm {
  name: string
  coverageLimit: string
  premium: string
  deductible: string
}

export interface VehicleForm {
  plate: string
  makeModel: string
  year: string
  usageType: string
  chassis: string
  fipeCode: string
  overnightCep: string
  lienStatus: string
  antiTheftDevice: string
  taxExempt: boolean
}

export interface OwnerForm {
  name: string
  document: string
  birthDate: string
  sex: string
  relationshipToInsured: string
}

export interface InsuredDetailsForm {
  document: string
  personType: string
  sex: string
  birthDate: string
  maritalStatus: string
  socialName: string
  bonusClass: string
  ci: string
}

export interface MainDriverForm {
  name: string
  birthDate: string
  document: string
  sex: string
  maritalStatus: string
}

export const emptyCoverage: CoverageForm = { name: '', coverageLimit: '', premium: '', deductible: '' }

export const emptyVehicle: VehicleForm = {
  plate: '', makeModel: '', year: '', usageType: 'PARTICULAR',
  chassis: '', fipeCode: '', overnightCep: '', lienStatus: '', antiTheftDevice: '', taxExempt: false,
}

export const emptyOwner: OwnerForm = {
  name: '', document: '', birthDate: '', sex: 'F', relationshipToInsured: '',
}

export const emptyInsuredDetails: InsuredDetailsForm = {
  document: '', personType: 'FISICA', sex: 'F', birthDate: '', maritalStatus: '',
  socialName: '', bonusClass: '', ci: '',
}

export const emptyMainDriver: MainDriverForm = {
  name: '', birthDate: '', document: '', sex: 'M', maritalStatus: '',
}

export const emptyPolicyForm = {
  cpf: '',
  insurerName: '',
  type: 'AUTO' as PolicyType,
  startDate: '',
  endDate: '',
  status: 'ATIVO' as PolicyStatus,
  pdfUrl: '',
  policyNumber: '',
  endorsementNumber: '',
  premiumAmount: '',
  paymentType: 'A_VISTA' as PaymentType,
  installments: '',
  coverages: [] as CoverageForm[],
  vehicle: emptyVehicle,
  hasOwner: false,
  owner: emptyOwner,
  insuredDetails: emptyInsuredDetails,
  hasMainDriver: false,
  mainDriver: emptyMainDriver,
}

function toEpochMs(dateStr: string): number {
  return dateStr ? new Date(dateStr).getTime() : 0
}

export function usePolicies(config: AdminConfig) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyPolicyForm)
  const [creating, setCreating] = useState(false)

  const [statusDraft, setStatusDraft] = useState<Record<string, PolicyStatus>>({})
  const [saving, setSaving] = useState<string | null>(null)

  function load() {
    listPolicies(config)
      .then((data) => {
        setPolicies(data)
        setStatusDraft(Object.fromEntries(data.map((p) => [p.id, p.status])))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [config])

  function addCoverage() {
    setForm({ ...form, coverages: [...form.coverages, { ...emptyCoverage }] })
  }

  function removeCoverage(index: number) {
    setForm({ ...form, coverages: form.coverages.filter((_, i) => i !== index) })
  }

  function updateCoverage(index: number, patch: Partial<CoverageForm>) {
    setForm({
      ...form,
      coverages: form.coverages.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    })
  }

  function setVehicle(patch: Partial<VehicleForm>) {
    setForm({ ...form, vehicle: { ...form.vehicle, ...patch } })
  }

  function setOwner(patch: Partial<OwnerForm>) {
    setForm({ ...form, owner: { ...form.owner, ...patch } })
  }

  function setInsuredDetails(patch: Partial<InsuredDetailsForm>) {
    setForm({ ...form, insuredDetails: { ...form.insuredDetails, ...patch } })
  }

  function setMainDriver(patch: Partial<MainDriverForm>) {
    setForm({ ...form, mainDriver: { ...form.mainDriver, ...patch } })
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createPolicy(config, {
        cpf: form.cpf,
        insurer_name: form.insurerName,
        type: form.type,
        start_date: toEpochMs(form.startDate),
        end_date: toEpochMs(form.endDate),
        status: form.status,
        pdf_url: form.pdfUrl || undefined,
        policy_number: form.policyNumber,
        endorsement_number: form.endorsementNumber,
        premium: {
          amount: parseFloat(form.premiumAmount) || 0,
          payment_type: form.paymentType,
          ...(form.paymentType === 'PARCELADO' ? { installments: parseInt(form.installments, 10) || 0 } : {}),
        },
        ...(form.type === 'AUTO' ? {
          auto: {
            coverages: form.coverages.map((c) => ({
              name: c.name,
              coverage_limit: parseFloat(c.coverageLimit) || 0,
              premium: parseFloat(c.premium) || 0,
              deductible: parseFloat(c.deductible) || 0,
            })),
            vehicle: {
              plate: form.vehicle.plate,
              make_model: form.vehicle.makeModel,
              year: parseInt(form.vehicle.year, 10) || 0,
              usage_type: form.vehicle.usageType,
              chassis: form.vehicle.chassis,
              fipe_code: form.vehicle.fipeCode,
              overnight_cep: form.vehicle.overnightCep,
              lien_status: form.vehicle.lienStatus || null,
              anti_theft_device: form.vehicle.antiTheftDevice || null,
              tax_exempt: form.vehicle.taxExempt,
            },
            owner: form.hasOwner ? {
              name: form.owner.name,
              document: form.owner.document,
              birth_date: toEpochMs(form.owner.birthDate),
              sex: form.owner.sex,
              relationship_to_insured: form.owner.relationshipToInsured,
            } : null,
            insured_details: {
              document: form.insuredDetails.document,
              person_type: form.insuredDetails.personType,
              sex: form.insuredDetails.sex,
              birth_date: toEpochMs(form.insuredDetails.birthDate),
              marital_status: form.insuredDetails.maritalStatus,
              social_name: form.insuredDetails.socialName || null,
              bonus_class: form.insuredDetails.bonusClass,
              ci: form.insuredDetails.ci,
            },
            main_driver: form.hasMainDriver ? {
              name: form.mainDriver.name,
              birth_date: toEpochMs(form.mainDriver.birthDate),
              document: form.mainDriver.document,
              sex: form.mainDriver.sex,
              marital_status: form.mainDriver.maritalStatus,
            } : null,
          },
        } : {}),
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

  async function saveStatus(id: string) {
    setSaving(id)
    try {
      await updatePolicyStatus(config, id, statusDraft[id])
      load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(null)
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
    statusDraft,
    setStatusDraft,
    saving,
    saveStatus,
    addCoverage,
    removeCoverage,
    updateCoverage,
    setVehicle,
    setOwner,
    setInsuredDetails,
    setMainDriver,
  }
}
