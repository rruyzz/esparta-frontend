// Espelha os json: tags dos models Go (snake_case).
// Equivalente a data classes no Kotlin — só dados, zero lógica.

// ── Usuário ──────────────────────────────────────────────────────────────────

export interface Address {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export type PersonType = 'FISICA' | 'JURIDICA'

export interface User {
  uid: string
  name: string
  email: string
  document: string
  person_type: PersonType
  phone?: string
  address?: Address
}

// ── Apólice ───────────────────────────────────────────────────────────────────

export type PolicyStatus = 'ATIVO' | 'PENDENTE' | 'CANCELADO' | 'VENCIDA'
export type PolicyType = 'VIDA' | 'AUTO' | 'RESIDENCIAL' | 'SAUDE' | 'VIAGEM'

export interface Policy {
  id: string
  insurer_name: string
  type: PolicyType
  start_date: number  // epoch ms
  end_date: number    // epoch ms
  status: PolicyStatus
  pdf_url: string
  document: string
  person_type: PersonType
  policy_number: string
  endorsement_number: string
  premium: Premium
  proposal_id?: string
  auto?: AutoPolicyPayload | null
}

export type PaymentType = 'A_VISTA' | 'PARCELADO'

export interface Premium {
  amount: number
  payment_type: PaymentType
  installments?: number
}

// Payload AUTO — ver docs/api-contracts-admin/apolices.md e
// docs/adr/0004-apolice-nao-reaproveita-tipos-da-cotacao.md (não é o mesmo
// conceito que QuoteCoverages/VehicleSnapshot da Cotação).

export interface PolicyCoverage {
  name: string
  coverage_limit: number
  premium: number
  deductible: number
}

export interface PolicyVehicle {
  plate: string
  make_model: string
  year: number
  usage_type: string
  chassis: string
  fipe_code: string
  overnight_cep: string
  lien_status: string | null
  anti_theft_device: string | null
  tax_exempt: boolean
}

// Proprietário (Apólice) — null quando Proprietário == Segurado.
export interface PolicyOwner {
  name: string
  document: string
  birth_date: number
  sex: string
  relationship_to_insured: string
}

// Segurado (Apólice) — escopado à Apólice AUTO, distinto da definição geral
// de Segurado que atravessa o domínio.
export interface PolicyInsuredDetails {
  document: string
  person_type: string
  sex: string
  birth_date: number
  marital_status: string
  social_name: string | null
  bonus_class: string
  ci: string
}

// Condutor Principal (Apólice) — campo opcional, não universal.
export interface PolicyMainDriver {
  name: string
  birth_date: number
  document: string
  sex: string
  marital_status: string
}

export interface AutoPolicyPayload {
  coverages: PolicyCoverage[]
  vehicle: PolicyVehicle
  owner: PolicyOwner | null
  insured_details: PolicyInsuredDetails
  main_driver: PolicyMainDriver | null
}

// ── Sinistro ──────────────────────────────────────────────────────────────────

export type ClaimStatus =
  | 'ABERTO'
  | 'EM_ANALISE'
  | 'DOCUMENTACAO_PENDENTE'
  | 'ENCERRADO'

export type OccurrenceType = 'COLISAO' | 'ROUBO' | 'INCENDIO' | 'OUTRO'

export interface Claim {
  id: string
  policy_id: string
  occurrence_type: OccurrenceType
  description: string
  photo_url?: string
  status: ClaimStatus
  status_note?: string
  status_updated_at: number  // epoch ms
  opened_at: number          // epoch ms
}

export interface ClaimHistoryEntry {
  id: string
  from_status: ClaimStatus
  to_status: ClaimStatus
  note?: string
  changed_at: number  // epoch ms
}

// ── Cotação ───────────────────────────────────────────────────────────────────

export type QuoteStatus = 'AGUARDANDO' | 'RESPONDIDA' | 'FECHADA'

export interface QuoteCoverages {
  comprehensive: boolean
  civil_liability: boolean
  personal_accidents: boolean
  rental_car: boolean
}

export interface VehicleSnapshot {
  plate: string
  year: number
  usage_type: string
  overnight_cep: string
}

export interface QuoteResponseData {
  premium: number    // R$
  valid_until: number  // epoch ms
  notes?: string
}

export interface Quote {
  id: string
  policy_id?: string
  vehicle_id: string
  vehicle_snapshot: VehicleSnapshot
  coverages: QuoteCoverages
  notes?: string
  status: QuoteStatus
  response?: QuoteResponseData
  responded_at?: number  // epoch ms
  closed_at?: number     // epoch ms
  created_at: number     // epoch ms
}

export interface QuoteHistoryEntry {
  from_status: QuoteStatus
  to_status: QuoteStatus
  note?: string
  changed_at: number  // epoch ms
}

// ── Veículo ───────────────────────────────────────────────────────────────────

export type VehicleUsageType = 'PARTICULAR' | 'COMERCIAL'

export interface Vehicle {
  id: string
  plate: string
  year: number
  usage_type: VehicleUsageType
  overnight_cep: string
  created_at: number  // epoch ms
}

// ── Proposta ──────────────────────────────────────────────────────────────────

export type ProposalStatus = 'GERADA' | 'ENVIADA' | 'ASSINADA'

export interface Proposal {
  id: string
  quote_id: string
  pdf_url: string
  status: ProposalStatus
  created_at: number  // epoch ms
  updated_at: number  // epoch ms
}
